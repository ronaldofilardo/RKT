import { useState, useEffect, useRef } from "react";
import { logger } from "@/lib/logger";
import { ensureAuthCookie, readAuthState, redirectToLogin } from "@/lib/auth-client";

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
