import { useCallback } from "react";
import { logger } from "@/lib/logger";
import type { DashboardView } from "../dashboard.types";

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
