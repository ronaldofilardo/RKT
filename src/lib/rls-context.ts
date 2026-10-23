import type { RLSUser } from './rls-storage.logic';
import { getRLSStore, isValidRLSUser, resetRLSStorage, enterRLSStore } from './rls-storage.logic';

export type { RLSUser } from './rls-storage.logic';
export { runWithRLS, runWithRLSSync } from './rls-context-run.logic';
export { withRLSMiddleware, withRLSFilter } from './rls-context-middleware.logic';

/**
 * Retorna o usuário RLS atual do contexto assíncrono.
 *
 * @returns RLSUser ou null se nenhum usuário estiver definido
 *
 * @example
 * const user = getRLSUser();
 * if (user) {
 *   // Filtrar dados por user.id
 * }
 */
export function getRLSUser(): RLSUser | null {
  return getRLSStore();
}

/**
 * @internal Apenas para testes. Permite simular o comportamento sticky do
 * `setRLSUser` original (antes da deprecação) sem restaurar a API deprecada
 * em produção. Usa `enterWith` deliberadamente — em testes não há concorrência
 * HTTP real e o risco de vazamento não se aplica.
 *
 * Gate de ambiente: lançar fora de test evita uso acidental em produção.
 */
export const __setRLSUserForTesting: (user: RLSUser | null) => void =
  process.env.NODE_ENV === 'test'
    ? (user) => {
        if (user === null) {
          resetRLSStorage();
          return;
        }
        if (!isValidRLSUser(user)) {
          throw new Error('Invalid RLS user in __setRLSUserForTesting');
        }
        resetRLSStorage();
        enterRLSStore(user);
      }
    : () => {
        throw new Error('__setRLSUserForTesting é proibido fora de testes');
      };

/**
 * Invalida o contexto RLS atual (cleanup). Apenas para testes.
 */
export const __clearRLSUserForTesting: () => void =
  process.env.NODE_ENV === 'test'
    ? () => {
        resetRLSStorage();
      }
    : () => {
        throw new Error('__clearRLSUserForTesting é proibido fora de testes');
      };

