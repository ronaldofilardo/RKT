import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import {
  ensureAuthCookie,
  readAuthState,
  redirectToLogin,
} from "@/lib/auth-client";
import { flushPendingAbandons } from "@/hooks/useSessionManager.pending-abandon";
import type { DashboardMatchPayload } from "@/components/dashboard/MatchCard";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

function checkAuthAndGetToken(router: AppRouterInstance | null, setLoading: (v: boolean) => void) {
  const { userRole } = readAuthState();
  const cookieOk = ensureAuthCookie();
  
  if (!userRole || !cookieOk) {
    setLoading(false);
    if (router) redirectToLogin(router);
    return null;
  }
  
  return true;
}

const fetchWithTimeout = (url: string, options: RequestInit = {}, ms = TIMEOUTS.MATCH_FETCH_TIMEOUT_MS, abortController?: AbortController) => {
  const controller = abortController || new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

const fetchMatchesEndpoint = async (url: string, router: AppRouterInstance | null, setLoading: (v: boolean) => void, abortController?: AbortController): Promise<DashboardMatchPayload[] | null> => {
  try {
    const res = await fetchWithTimeout(url, {}, TIMEOUTS.MATCH_FETCH_TIMEOUT_MS, abortController);

    if (res.status === 401) {
      setLoading(false);
      if (router) redirectToLogin(router);
      return null;
    }
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.matches ?? json?.matches ?? [];
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') return [];
    logger.error(`[fetchDashboardData] fetch error for ${url}:`, error);
    return [];
  }
};

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

export function useDashboardMatchFilters(matches: DashboardMatchPayload[], suspendedFromApi: DashboardMatchPayload[]) {
  const finishedMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "FINISHED"),
    [matches],
  );

  const liveMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "IN_PROGRESS"),
    [matches],
  );

  const pendingMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "SCHEDULED"),
    [matches],
  );

  const historyMatches = useMemo(
    () => matches.filter((m: DashboardMatchPayload) => m.state === "FINISHED" || m.state === "CANCELLED"),
    [matches],
  );

  const visibleMatches = useMemo(() => {
    if (suspendedFromApi.length === 0) return matches;
    const suspendedIds = new Set(suspendedFromApi.map((m: DashboardMatchPayload) => m.id));
    return matches.filter((m: DashboardMatchPayload) => !suspendedIds.has(m.id));
  }, [matches, suspendedFromApi]);

  return {
    finishedMatches,
    liveMatches,
    pendingMatches,
    historyMatches,
    visibleMatches,
  };
}
