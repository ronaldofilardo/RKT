import { useState, useCallback, useEffect } from "react";
import type { DashboardView } from "./dashboard.types";

export function useDashboardNavigation(router: any) {
  const handleNavigate = useCallback(
    (view: DashboardView) => {
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
        default:
          router.push("/dashboard");
      }
    },
    [router]
  );

  return { handleNavigate };
}

export function useDashboardData() {
  const [matches, setMatches] = useState([]);
  const [suspendedFromApi, setSuspendedFromApi] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(() => {
    const accessToken = sessionStorage.getItem("access_token");
    Promise.all([
      fetch("/api/matches", {
        headers: { authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : { matches: [] })),
      fetch("/api/matches/suspended-sessions", {
        headers: { authorization: `Bearer ${accessToken}` },
      }).then((r) => (r.ok ? r.json() : { matches: [] })),
    ])
      .then(([matchData, suspendedData]) => {
        setMatches(matchData.matches || []);
        setSuspendedFromApi(suspendedData.matches || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
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

  useEffect(() => {
    const userId = sessionStorage.getItem("user_id");
    const userRole = sessionStorage.getItem("user_role");

    if (!userId || !userRole) {
      router.push("/login");
      return;
    }

    setUser({
      id: userId,
      name: "Usuário",
      email: "",
      role: userRole,
    });
  }, [router]);

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