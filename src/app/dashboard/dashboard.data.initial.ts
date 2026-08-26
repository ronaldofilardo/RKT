import { logger } from "@/lib/logger";
import { fetchWithTimeout } from './dashboard.fetch';
import { isTokenExpired } from "@/lib/jwt-client";
import { TIMEOUTS } from "@/lib/constants";
import { ensureAuthCookie, readAuthState, redirectToLogin } from "@/lib/auth-client";
import type { Match } from './dashboard.types';

type Router = { push: (path: string) => void; replace: (path: string) => void };
type InitialDeps = {
  fetchedRef: { current: boolean };
  routerRef: { current: Router | undefined };
  setLoading: (value: boolean) => void;
  setMatches: (value: Match[]) => void;
  setSuspendedFromApi: (value: Match[]) => void;
};

export function runInitialDashboardFetch(deps: InitialDeps): void {

    if (deps.fetchedRef.current) return;
    deps.fetchedRef.current = true;

    const { accessToken } = readAuthState();
    const cookieOk = ensureAuthCookie();
    logger.info("[fetchDashboardData] token?", accessToken ? "present" : "missing", "cookie?", cookieOk ? "ok" : "missing");

    if (!accessToken || !cookieOk) {
      logger.warn("[fetchDashboardData] no token/cookie, aborting fetch");
      deps.setLoading(false);
      redirectToLogin(deps.routerRef.current);
      return;
    }

    if (isTokenExpired(accessToken)) {
      logger.warn("[fetchDashboardData] token expired, redirecting");
      deps.setLoading(false);
      redirectToLogin(deps.routerRef.current);
      return;
    }

    const timeoutId = setTimeout(() => {
      logger.warn("[fetchDashboardData] timeout 15s");
      deps.setLoading(false);
    }, TIMEOUTS.DASHBOARD_FETCH_TIMEOUT_MS);

    logger.info("[fetchDashboardData] starting fetches");

    const matchPromise = fetchWithTimeout("/api/matches", {
      headers: { authorization: `Bearer ${accessToken}` },
    }, TIMEOUTS.MATCH_FETCH_TIMEOUT_MS).then(async (matchRes) => {
      clearTimeout(timeoutId);
      logger.info("[fetchDashboardData] matches response:", matchRes.status);
      if (matchRes.status === 401) {
        logger.warn("[fetchDashboardData] /api/matches returned 401, redirecting to /login");
        deps.setLoading(false);
        redirectToLogin(deps.routerRef.current);
        return null;
      }
      if (!matchRes.ok) return [];
      const matchJson = await matchRes.json();
      return matchJson?.data?.matches ?? matchJson?.matches ?? [];
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') return [];
      logger.error("[fetchDashboardData] matches fetch error:", error);
      return [];
    });

    const suspendedPromise = fetchWithTimeout("/api/matches/suspended-sessions", {
      headers: { authorization: `Bearer ${accessToken}` },
    }, TIMEOUTS.MATCH_FETCH_TIMEOUT_MS).then(async (suspendedRes) => {
      clearTimeout(timeoutId);
      logger.info("[fetchDashboardData] suspended-sessions response:", suspendedRes.status);
      if (suspendedRes.status === 401) {
        logger.warn("[fetchDashboardData] /api/matches/suspended-sessions returned 401, redirecting to /login");
        deps.setLoading(false);
        redirectToLogin(deps.routerRef.current);
        return [];
      }
      if (!suspendedRes.ok) return [];
      const suspendedJson = await suspendedRes.json();
      return suspendedJson?.data?.matches ?? suspendedJson?.matches ?? [];
    }).catch((error) => {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') return [];
      logger.error("[fetchDashboardData] suspended-sessions fetch error:", error);
      return [];
    });

    Promise.all([matchPromise, suspendedPromise])
      .then(([matchList, suspendedList]) => {
        clearTimeout(timeoutId);
        logger.info("[fetchDashboardData] parsed:", matchList.length, suspendedList.length);
        const suspendedIds = new Set(suspendedList.map((match: Match) => match.id));
        const dedupedMatches = matchList.filter((match: Match) => !suspendedIds.has(match.id));
        deps.setMatches(dedupedMatches);
        deps.setSuspendedFromApi(suspendedList);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === "AbortError") {
          logger.info("[fetchDashboardData] aborted (cleanup)");
          return;
        }
        logger.error("[fetchDashboardData] Error:", error);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        logger.info("[fetchDashboardData] END");
        deps.setLoading(false);
      });
}
