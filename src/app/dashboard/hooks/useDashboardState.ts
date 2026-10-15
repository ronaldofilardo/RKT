import { useState, useEffect, useRef } from "react";
import { logger } from "@/lib/logger";
import { ensureAuthCookie, readAuthState, redirectToLogin } from "@/lib/auth-client";
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
    ensureAuthCookie();
    const { userId, userRole, userName } = readAuthState();

    if (!userId || !userRole) {
      logger.warn("[useUserAuth] missing user_id/user_role, redirecting to /login");
      redirectToLogin(routerRef.current);
      return;
    }

    setUser({
      id: userId,
      name: userName || "",
      email: "",
      role: userRole,
    });

    if (!userName && typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user?.name) {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("user_name", data.user.name);
            }
            setUser((prev) =>
              prev ? { ...prev, name: data.user.name, email: data.user.email || "" } : null
            );
          }
        })
        .catch(() => {});
    }
  }, []);

  return { user, setUser };
}


