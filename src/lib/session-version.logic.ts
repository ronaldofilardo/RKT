import { logger } from './logger';

/** Meta de revogação ≤ 60 s (F16): validade do cache por instância. */
export const SESSION_CACHE_TTL_MS = 60_000;

interface SessionState {
  sessionVersion: number;
  isActive: boolean;
}

interface CacheEntry {
  state: SessionState | null;
  at: number;
}

const cache = new Map<string, CacheEntry>();

async function loadState(userId: string): Promise<SessionState | null> {
  const { prisma } = await import('./prisma');
  return prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true, isActive: true },
  });
}

async function getState(userId: string, now: number): Promise<SessionState | null> {
  const hit = cache.get(userId);
  if (hit && now - hit.at < SESSION_CACHE_TTL_MS) return hit.state;
  const state = await loadState(userId);
  cache.set(userId, { state, at: now });
  return state;
}

/**
 * A sessão do token ainda vale? Tokens sem `sv` (legados) sempre valem.
 * Com `sv`: conta existente, ativa e `sv` não anterior à versão do banco.
 * Falha de leitura NÃO derruba o sistema (fail-open + log), como era antes.
 */
export async function isSessionCurrent(
  userId: string,
  sv: number | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (sv === undefined) return true;
  try {
    const state = await getState(userId, now);
    if (!state || !state.isActive) return false;
    return sv >= state.sessionVersion;
  } catch (error) {
    logger.warn('[SESSION] Falha ao conferir sessionVersion; sessão aceita:', error);
    return true;
  }
}

/** Esquece o estado em cache (usar após trocar senha/vínculo/suspender). */
export function invalidateSessionCache(userId?: string): void {
  if (userId) cache.delete(userId);
  else cache.clear();
}
