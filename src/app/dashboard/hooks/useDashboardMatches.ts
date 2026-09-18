import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { logger } from "@/lib/logger";
import { isTokenExpired } from "@/lib/jwt-client";
import { TIMEOUTS } from "@/lib/constants";
import {
  ensureAuthCookie,
  readAuthState,
  redirectToLogin,
} from "@/lib/auth-client";
import type { Match } from "../dashboard.types";
import { flushPendingAbandons } from "@/hooks/useSessionManager.pending-abandon";

function checkAuthAndGetToken(router: any, setLoading: (v: boolean) => void) {
  const { accessToken } = readAuthState();
  const cookieOk = ensureAuthCookie();
  
  if (!accessToken || !cookieOk) {
    setLoading(false);
    redirectToLogin(router);
    return null;
  }
  
  if (isTokenExpired(accessToken)) {
    setLoading(false);
    redirectToLogin(router);
    return null;
  }
  
  return accessToken;
}

const fetchWithTimeout = (url: string, options: RequestInit = {}, ms = TIMEOUTS.MATCH_FETCH_TIMEOUT_MS, abortController?: AbortController) => {
  const controller = abortController || new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

const fetchMatchesEndpoint = async (url: string, accessToken: string, router: any, setLoading: (v: boolean) => void, abortController?: AbortController) => {
  try {
    const res = await fetchWithTimeout(url, {
      headers: { authorization: `Bearer ${accessToken}` },
    }, TIMEOUTS.MATCH_FETCH_TIMEOUT_MS, abortController);

    if (res.status === 401) {
      setLoading(false);
      redirectToLogin(router);
      return null;
    }
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.matches ?? json?.matches ?? [];
  } catch (error: any) {
    if (error?.name === 'AbortError') return [];
    logger.error(`[fetchDashboardData] fetch error for ${url}:`, error);
    return [];
  }
};

export function useDashboardData(router?: any) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [suspendedFromApi, setSuspendedFromApi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const routerRef = useRef(router);
  routerRef.current = router;
  const dashboardAbortRef = useRef<AbortController | null>(null);

  const performFetch = useCallback(async (abortController: AbortController, isInitial = false) => {
    const accessToken = checkAuthAndGetToken(routerRef.current, setLoading);
    if (!accessToken) return;

    if (isInitial) {
      flushPendingAbandons().catch((e) =>
        logger.warn("[fetchDashboardData] flushPendingAbandons falhou:", e)
      );
    }

    const matchPromise = fetchMatchesEndpoint("/api/matches", accessToken, routerRef.current, setLoading, abortController);
    const suspendedPromise = fetchMatchesEndpoint("/api/matches/suspended-sessions", accessToken, routerRef.current, setLoading, abortController);

    try {
      const [matchList, suspendedList] = await Promise.all([matchPromise, suspendedPromise]);
      if (matchList === null || suspendedList === null) return;

      const suspendedIds = new Set(suspendedList.map((m: any) => m.id));
      const dedupedMatches = matchList.filter((m: any) => !suspendedIds.has(m.id));
      setMatches(dedupedMatches);
      setSuspendedFromApi(suspendedList);
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        logger.error("[fetchDashboardData] Error:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const controller = new AbortController();
    dashboardAbortRef.current = controller;
    
    performFetch(controller, true);

    return () => {
      controller.abort();
    };
  }, [performFetch]);

  const fetchDashboardData = useCallback(() => {
    fetchedRef.current = false;
    setLoading(true);
    dashboardAbortRef.current?.abort();
    const controller = new AbortController();
    dashboardAbortRef.current = controller;
    performFetch(controller, false);
  }, [performFetch]);

  return { matches, setMatches, suspendedFromApi, setSuspendedFromApi, loading, fetchDashboardData };
}

export function useDashboardMatchFilters(matches: Match[], suspendedFromApi: any[]) {
  const finishedMatches = useMemo(
    () => matches.filter((m: any) => m.state === "FINISHED"),
    [matches],
  );

  const liveMatches = useMemo(
    () => matches.filter((m: any) => m.state === "IN_PROGRESS"),
    [matches],
  );

  const pendingMatches = useMemo(
    () => matches.filter((m: any) => m.state === "SCHEDULED"),
    [matches],
  );

  const historyMatches = useMemo(
    () => matches.filter((m: any) => m.state === "FINISHED" || m.state === "CANCELLED"),
    [matches],
  );

  const visibleMatches = useMemo(() => {
    if (suspendedFromApi.length === 0) return matches;
    const suspendedIds = new Set(suspendedFromApi.map((m: any) => m.id));
    return matches.filter((m: any) => !suspendedIds.has(m.id));
  }, [matches, suspendedFromApi]);

  return {
    finishedMatches,
    liveMatches,
    pendingMatches,
    historyMatches,
    visibleMatches,
  };
}
