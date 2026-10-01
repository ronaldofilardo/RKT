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


