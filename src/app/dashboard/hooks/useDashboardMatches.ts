import { useState, useCallback, useEffect, useRef } from "react";
import { logger } from "@/lib/logger";
import { flushPendingAbandons } from "@/hooks/useSessionManager.pending-abandon";
import type { DashboardMatchPayload } from "@/components/dashboard/MatchCard";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { checkAuthAndGetToken, fetchMatchesEndpoint } from "./use-dashboard-matches-fetch";
import { useDashboardMatchFilters } from "./use-dashboard-matches-filters";

export function useDashboardData(router?: AppRouterInstance) {
  const [matches, setMatches] = useState<DashboardMatchPayload[]>([]);
  const [suspendedFromApi, setSuspendedFromApi] = useState<DashboardMatchPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const routerRef = useRef(router ?? null);
  routerRef.current = router ?? null;
  const dashboardAbortRef = useRef<AbortController | null>(null);

  const performFetch = useCallback(async (abortController: AbortController, isInitial = false) => {
    const hasAuth = checkAuthAndGetToken(routerRef.current, setLoading);
    if (!hasAuth) return;

    if (isInitial) {
      flushPendingAbandons().catch((e) =>
        logger.warn("[fetchDashboardData] flushPendingAbandons falhou:", e)
      );
    }

    const matchPromise = fetchMatchesEndpoint("/api/matches", routerRef.current, setLoading, abortController);
    const suspendedPromise = fetchMatchesEndpoint("/api/matches/suspended-sessions", routerRef.current, setLoading, abortController);

    try {
      const [matchList, suspendedList] = await Promise.all([matchPromise, suspendedPromise]);
      if (matchList === null || suspendedList === null) return;

      const suspendedIds = new Set(suspendedList.map((m: DashboardMatchPayload) => m.id));
      const dedupedMatches = matchList.filter((m: DashboardMatchPayload) => !suspendedIds.has(m.id));
      setMatches(dedupedMatches);
      setSuspendedFromApi(suspendedList);
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== "AbortError") {
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

export { useDashboardMatchFilters };
