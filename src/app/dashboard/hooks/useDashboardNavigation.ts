import { useCallback } from "react";
import { logger } from "@/lib/logger";
import { useAreaPath } from "@/hooks/use-area-path";
import type { DashboardView, RouterLike } from "../dashboard.types";

export function useDashboardNavigation(router: RouterLike) {
  const toAreaPath = useAreaPath();

  const navigateToTarget = useCallback(
    (view: DashboardView) => {
      logger.info("[DashboardNavigation] navigating to", view);
      switch (view) {
        case "history":
          router.push(toAreaPath("/historico") as any);
          break;
        case "annotated":
          router.push(toAreaPath("/partidasanotadas") as any);
          break;
        case "live":
          router.push(toAreaPath("/partidasaovivo") as any);
          break;
        case "pending":
          router.push(toAreaPath("/aguardandoanotador") as any);
          break;
        case "profile":
          router.push(toAreaPath("/dados-pessoais") as any);
          break;
        case "atletas":
          router.push(toAreaPath("/atletas") as any);
          break;
        case "newMatch":
          router.push(toAreaPath("/match/new") as any);
          break;
        case "admin":
          router.push(toAreaPath("/admin") as any);
          break;
        default:
          router.push(toAreaPath("/dashboard") as any);
      }
    },
    [router, toAreaPath]
  );

  return { navigateToTarget };
}
