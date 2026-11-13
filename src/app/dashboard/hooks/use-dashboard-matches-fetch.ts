import { logger } from "@/lib/logger";
import { TIMEOUTS } from "@/lib/constants";
import { isTokenExpired } from "@/lib/jwt-client";
import { ensureAuthCookie, readAuthState, redirectToLogin, ensureSessionHydrated, clearAuthState, performLogout } from "@/lib/auth-client";
import type { DashboardMatchPayload } from "@/components/dashboard/MatchCard";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Resultado discriminado da leitura de uma lista de partidas: `ok: false`
 * distingue erro HTTP/timeout/rede de "a lista está vazia" (só afirmável com
 * `ok: true && matches.length === 0`).
 */
export type FetchMatchesResult =
  | { ok: true; matches: DashboardMatchPayload[]; nextCursor: string | null }
  | { ok: false; errorMessage: string };

export async function checkAuthAndGetToken(router: AppRouterInstance | null): Promise<boolean> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
  if (token && isTokenExpired(token)) {
    clearAuthState();
    void performLogout();
    redirectToLogin(router, 'exit=1');
    return false;
  }

  const { userRole } = readAuthState();
  if (userRole && ensureAuthCookie()) return true;

  return ensureSessionHydrated(router);
}

/**
 * `fetch` com timeout próprio: o controller interno aborta ao estourar o tempo
 * e vira `TimeoutError`; o controller externo (unmount/refresh/troca de aba)
 * cancela a requisição sem virar falha de carga.
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  ms = TIMEOUTS.MATCH_FETCH_TIMEOUT_MS,
  externalController?: AbortController,
): Promise<Response> => {
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort();
  if (externalController?.signal.aborted) controller.abort();
  else externalController?.signal.addEventListener('abort', onExternalAbort, { once: true });

  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (timedOut && error instanceof Error && error.name === 'AbortError') {
      const timeoutError = new Error(`Timeout de ${ms}ms ao carregar ${url}`);
      timeoutError.name = 'TimeoutError';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
    externalController?.signal.removeEventListener('abort', onExternalAbort);
  }
};

export const fetchMatchesEndpoint = async (
  url: string,
  router: AppRouterInstance | null,
  abortController?: AbortController,
): Promise<FetchMatchesResult> => {
  try {
    const res = await fetchWithTimeout(url, {}, TIMEOUTS.MATCH_FETCH_TIMEOUT_MS, abortController);

    if (res.status === 401) {
      if (router) redirectToLogin(router);
      return { ok: false, errorMessage: 'Sessão expirada. Entre novamente.' };
    }
    if (!res.ok) return { ok: false, errorMessage: 'Não foi possível carregar as partidas.' };

    const json = await res.json();
    return {
      ok: true,
      matches: json?.data?.matches ?? json?.matches ?? [],
      nextCursor: json?.data?.nextCursor ?? json?.nextCursor ?? null,
    };
  } catch (error: unknown) {
    // Cancelamento do cliente (unmount/refresh/troca de aba) não é falha de carga.
    if (abortController?.signal.aborted) return { ok: false, errorMessage: 'Requisição cancelada.' };
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      return { ok: false, errorMessage: 'Tempo esgotado ao carregar as partidas.' };
    }
    logger.error(`[fetchDashboardData] fetch error for ${url}:`, error);
    return { ok: false, errorMessage: 'Não foi possível carregar as partidas.' };
  }
};
