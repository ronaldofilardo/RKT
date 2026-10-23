import { logger } from './logger';
import type { RLSUser } from './rls-storage.logic';
import { isValidRLSUser, runWithStore, runWithStoreSync } from './rls-storage.logic';

/**
 * Executa uma função com contexto RLS e faz cleanup automático após conclusão.
 *
 * ✅ Preferir esta função ao invés de setRLSUser direto.
 *
 * @param user - Usuário RLS para contexto
 * @param fn - Função para executar com contexto
 * @returns Resultado da função
 *
 * @example
 * const result = await runWithRLS({ id: 'user-123', role: 'ATHLETE' }, async () => {
 *   // Código com contexto RLS ativo
 *   return await matchService.listMatches();
 * });
 * // Contexto automaticamente limpo aqui
 */
export async function runWithRLS<T>(user: RLSUser | null, fn: () => Promise<T>): Promise<T> {
  if (!user) {
    return fn();
  }

  if (!isValidRLSUser(user)) {
    logger.error('[RLS] Usuário inválido em runWithRLS:', user);
    throw new Error('Invalid RLS user in runWithRLS');
  }

  try {
    return await runWithStore(user, fn);
  } finally {
    // AsyncLocalStorage.run() handles context scoping automatically.
    // Do NOT call rlsStorage.disable() here — it destroys the parent context
    // and breaks nested runWithRLS calls.
  }
}

/**
 * Executa uma função síncrona com contexto RLS e faz cleanup automático.
 *
 * @param user - Usuário RLS para contexto
 * @param fn - Função síncrona para executar com contexto
 * @returns Resultado da função
 *
 * @example
 * const result = runWithRLSSync({ id: 'user-123', role: 'ATHLETE' }, () => {
 *   return matchService.getCachedMatches();
 * });
 */
export function runWithRLSSync<T>(user: RLSUser | null, fn: () => T): T {
  if (!user) {
    return fn();
  }

  if (!isValidRLSUser(user)) {
    logger.error('[RLS] Usuário inválido em runWithRLSSync:', user);
    throw new Error('Invalid RLS user in runWithRLSSync');
  }

  try {
    return runWithStoreSync(user, fn);
  } finally {
    // AsyncLocalStorage.run() handles context scoping automatically.
    // Do NOT call rlsStorage.disable() here — same reason as runWithRLS.
  }
}
