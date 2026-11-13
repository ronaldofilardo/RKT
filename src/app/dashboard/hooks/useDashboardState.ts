import { useState, useEffect, useRef } from "react";
import { ensureAuthCookie, readAuthState, redirectToLogin, hydrateSessionFromMe } from "@/lib/auth-client";
import type { DeletableMatch, FinishableMatch, RouterLike } from "../dashboard.types";

export function useModalState() {
  const [showNewAthleteModal, setShowNewAthleteModal] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<DeletableMatch | null>(null);
  const [matchToFinish, setMatchToFinish] = useState<FinishableMatch | null>(null);

  return {
    showNewAthleteModal,
    setShowNewAthleteModal,
    matchToDelete,
    setMatchToDelete,
    matchToFinish,
    setMatchToFinish,
  };
}

export function useUserAuth(router: RouterLike) {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    let active = true;
    void (async () => {
      ensureAuthCookie();
      const current = readAuthState();
      if (current.userId && current.userRole && active) {
        setUser({ id: current.userId, name: current.userName || "", email: "", role: current.userRole });
      }
      const hyd = await hydrateSessionFromMe();
      if (!active) return;
      if (hyd.ok && hyd.user) {
        setUser({ id: hyd.user.id, name: hyd.user.name || "", email: "", role: hyd.user.role });
      } else if (hyd.reason === "unauthorized") {
        redirectToLogin(routerRef.current);
      }
    })();
    return () => { active = false; };
  }, []);

  return { user, setUser };
}


