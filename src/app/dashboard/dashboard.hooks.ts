import { useState, useCallback, useEffect, useRef } from "react";
import { logger } from "@/lib/logger";
import { isTokenExpired } from "@/lib/jwt-client";
import {
  ensureAuthCookie,
  readAuthState,
  redirectToLogin,
} from "@/lib/auth-client";
import type { DashboardView, Match } from "./dashboard.types";

export function useDashboardNavigation(router: any) {
  const handleNavigate = useCallback(
    (view: DashboardView) => {
      logger.info("[DashboardNavigation] navigating to", view);
      switch (view) {
        case "history":
          router.push("/historico");
          break;
        case "annotated":
          router.push("/partidasanotadas");
          break;
        case "live":
          router.push("/partidasaovivo");
          break;
        case "pending":
          router.push("/aguardandoanotador");
          break;
        case "profile":
          router.push("/dados-pessoais");
          break;
        case "atletas":
          router.push("/atletas");
          break;
        case "newMatch":
          router.push("/match/new");
          break;
        case "admin":
          router.push("/admin");
          break;
        default:
          router.push("/dashboard");
      }
    },
    [router]
  );

  return { handleNavigate };
}

export function useDashboardData(router?: any) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [suspendedFromApi, setSuspendedFromApi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const { accessToken } = readAuthState();
    const cookieOk = ensureAuthCookie();
    logger.info("[fetchDashboardData] token?", accessToken ? "present" : "missing", "cookie?", cookieOk ? "ok" : "missing");

    if (!accessToken || !cookieOk) {
      logger.warn("[fetchDashboardData] no token/cookie, aborting fetch");
      setLoading(false);
      redirectToLogin(routerRef.current);
      return;
    }

    if (isTokenExpired(accessToken)) {
      logger.warn("[fetchDashboardData] token expired, redirecting");
      setLoading(false);
      redirectToLogin(routerRef.current);
      return;
    }

    const timeoutId = setTimeout(() => {
      logger.warn("[fetchDashboardData] timeout 15s");
      setLoading(false);
    }, 15000);

    logger.info("[fetchDashboardData] starting fetches");

    const fetchWithTimeout = (url: string, options: RequestInit = {}, ms = 10000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
    };

    const matchPromise = fetchWithTimeout("/api/matches", {
      headers: { authorization: `Bearer ${accessToken}` },
    }, 10000).then(async (matchRes) => {
      clearTimeout(timeoutId);
      logger.info("[fetchDashboardData] matches response:", matchRes.status);
      if (matchRes.status === 401) {
        logger.warn("[fetchDashboardData] /api/matches returned 401, redirecting to /login");
        setLoading(false);
        redirectToLogin(routerRef.current);
        return null;
      }
      if (!matchRes.ok) return [];
      const matchJson = await matchRes.json();
      return matchJson?.data?.matches ?? matchJson?.matches ?? [];
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') return [];
      logger.error("[fetchDashboardData] matches fetch error:", error);
      return [];
    });

    const suspendedPromise = fetchWithTimeout("/api/matches/suspended-sessions", {
      headers: { authorization: `Bearer ${accessToken}` },
    }, 10000).then(async (suspendedRes) => {
      clearTimeout(timeoutId);
      logger.info("[fetchDashboardData] suspended-sessions response:", suspendedRes.status);
      if (suspendedRes.status === 401) {
        logger.warn("[fetchDashboardData] /api/matches/suspended-sessions returned 401, redirecting to /login");
        setLoading(false);
        redirectToLogin(routerRef.current);
        return [];
      }
      if (!suspendedRes.ok) return [];
      const suspendedJson = await suspendedRes.json();
      return suspendedJson?.data?.matches ?? suspendedJson?.matches ?? [];
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') return [];
      logger.error("[fetchDashboardData] suspended-sessions fetch error:", error);
      return [];
    });

    Promise.all([matchPromise, suspendedPromise])
      .then(([matchList, suspendedList]) => {
        clearTimeout(timeoutId);
        logger.info("[fetchDashboardData] parsed:", matchList.length, suspendedList.length);
        const suspendedIds = new Set(suspendedList.map((m: any) => m.id));
        const dedupedMatches = matchList.filter((m: any) => !suspendedIds.has(m.id));
        setMatches(dedupedMatches);
        setSuspendedFromApi(suspendedList);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === "AbortError") {
          logger.info("[fetchDashboardData] aborted (cleanup)");
          return;
        }
        logger.error("[fetchDashboardData] Error:", error);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        logger.info("[fetchDashboardData] END");
        setLoading(false);
      });
  }, []);

  const fetchDashboardData = useCallback(() => {
    fetchedRef.current = false;
    const { accessToken } = readAuthState();
    const cookieOk = ensureAuthCookie();

    if (!accessToken || !cookieOk) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchWithTimeout = (url: string, options: RequestInit = {}, ms = 10000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timer));
    };

    const matchPromise = fetchWithTimeout("/api/matches", {
      headers: { authorization: `Bearer ${accessToken}` },
    }, 10000).then(async (matchRes) => {
      if (matchRes.status === 401) return null;
      if (!matchRes.ok) return [];
      const matchJson = await matchRes.json();
      return matchJson?.data?.matches ?? matchJson?.matches ?? [];
    }).catch(() => []);

    const suspendedPromise = fetchWithTimeout("/api/matches/suspended-sessions", {
      headers: { authorization: `Bearer ${accessToken}` },
    }, 10000).then(async (suspendedRes) => {
      if (suspendedRes.status === 401) return null;
      if (!suspendedRes.ok) return [];
      const suspendedJson = await suspendedRes.json();
      return suspendedJson?.data?.matches ?? suspendedJson?.matches ?? [];
    }).catch(() => []);

    Promise.all([matchPromise, suspendedPromise])
      .then(([matchList, suspendedList]) => {
        if (matchList === null || suspendedList === null) {
          redirectToLogin(routerRef.current);
          return;
        }
        const suspendedIds = new Set(suspendedList.map((m: any) => m.id));
        const dedupedMatches = matchList.filter((m: any) => !suspendedIds.has(m.id));
        setMatches(dedupedMatches);
        setSuspendedFromApi(suspendedList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { matches, setMatches, suspendedFromApi, setSuspendedFromApi, loading, fetchDashboardData };
}

export function useModalState() {
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<any | null>(null);
  const [matchToFinish, setMatchToFinish] = useState<any | null>(null);

  return {
    showNewAthleteModal,
    setShowNewAthleteModal,
    matchToDelete,
    setMatchToDelete,
    matchToFinish,
    setMatchToFinish,
  };
}

export function useUserAuth(router: any) {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    ensureAuthCookie();
    const { userId, userRole } = readAuthState();

    if (!userId || !userRole) {
      logger.warn("[useUserAuth] missing user_id/user_role, redirecting to /login");
      redirectToLogin(routerRef.current);
      return;
    }

    setUser({
      id: userId,
      name: "Usuário",
      email: "",
      role: userRole,
    });
  }, []);

  return { user, setUser };
}

export function useWindowFocus(callback: () => void) {
  useEffect(() => {
    const handleFocus = () => callback();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [callback]);
}

export function useVisibilityChange(callback: () => void) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastAbandon = sessionStorage.getItem("last_abandon_timestamp");
        if (lastAbandon) {
          const lastTime = parseInt(lastAbandon, 10);
          const now = Date.now();
          if (now - lastTime < 60000) {
            callback();
          }
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [callback]);
}