import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import { isTokenExpired } from "@/lib/jwt-client";
import {
  ensureAuthCookie,
  readAuthState,
  redirectToLogin,
} from "@/lib/auth-client";
import type { DashboardMatchPayload } from "@/components/dashboard/MatchCard";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function checkAuthAndGetToken(router: AppRouterInstance | null, setLoading: (v: boolean) => void) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  if (token && isTokenExpired(token)) {
    setLoading(false);
    redirectToLogin(router);
    return null;
  }

  const { userRole } = readAuthState();
  const cookieOk = ensureAuthCookie();
  
  if (!userRole || !cookieOk) {
    setLoading(false);
    redirectToLogin(router);
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

export const fetchMatchesEndpoint = async (url: string, router: AppRouterInstance | null, setLoading: (v: boolean) => void, abortController?: AbortController): Promise<DashboardMatchPayload[] | null> => {
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
