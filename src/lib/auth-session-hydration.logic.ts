import { readAuthState, writeToSessionOnly, redirectToLogin } from './auth-client-storage';
import { logger } from './logger';

export interface HydrateResult {
  ok: boolean;
  reason?: 'ssr' | 'cached' | 'unauthorized' | 'server_error' | 'network_error';
  user?: { id: string; role: string; name?: string };
}

let inFlightHydration: Promise<HydrateResult> | null = null;

/**
 * Consulta /api/auth/me usando os cookies HttpOnly existentes para repovoar
 * o sessionStorage quando o usuário abre em nova aba ou recarrega o app.
 */
export async function hydrateSessionFromMe(options?: { force?: boolean }): Promise<HydrateResult> {
  if (typeof window === 'undefined') return { ok: false, reason: 'ssr' };

  const current = readAuthState();
  if (!options?.force && current.userId && current.userRole) {
    return { ok: true, reason: 'cached', user: { id: current.userId, role: current.userRole, name: current.userName || undefined } };
  }

  if (inFlightHydration) return inFlightHydration;

  inFlightHydration = (async (): Promise<HydrateResult> => {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        if (data?.user?.id && data?.user?.role) {
          writeToSessionOnly({
            userId: data.user.id,
            userRole: data.user.role,
            userName: data.user.name,
          });
          if (data.activeArea) sessionStorage.setItem('active_area', data.activeArea);
          if (data.activeContextId) sessionStorage.setItem('active_context_id', data.activeContextId);
          return {
            ok: true,
            user: { id: data.user.id, role: data.user.role, name: data.user.name },
          };
        }
      }
      if (res.status === 401) {
        return { ok: false, reason: 'unauthorized' };
      }
      return { ok: false, reason: 'server_error' };
    } catch (err) {
      logger.warn('[hydrateSessionFromMe] Falha de rede ao consultar /api/auth/me:', err);
      return { ok: false, reason: 'network_error' };
    } finally {
      inFlightHydration = null;
    }
  })();

  return inFlightHydration;
}

/**
 * Garante que a sessão está hidratada antes de prosseguir.
 * Se a resposta for 401 (sessão inválida), redireciona suavemente para /login.
 * Se for falha de rede/servidor, não redireciona para evitar falso logout.
 */
export async function ensureSessionHydrated(router?: unknown): Promise<boolean> {
  const result = await hydrateSessionFromMe();
  if (result.ok) return true;
  if (result.reason === 'unauthorized') {
    redirectToLogin(router);
  }
  return false;
}

