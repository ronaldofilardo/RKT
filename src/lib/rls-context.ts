import type { RLSUser } from './rls-storage.logic';
import { getRLSStore, isValidRLSUser, resetRLSStorage, enterRLSStore, runWithStore } from './rls-storage.logic';
import { logger } from './logger';

export type { RLSUser } from './rls-storage.logic';
export { runWithRLS, runWithRLSSync } from './rls-context-run.logic';

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

/**
 * Cria um middleware wrapper que injeta contexto RLS automaticamente.
 *
 * @param getUser - Função para extrair usuário da request
 * @param handler - Handler para executar com contexto RLS
 *
 * @example
 * // Em middleware.ts:
 * export const middleware = withRLSMiddleware(
 *   (request) => getUserFromToken(request),
 *   async (request, user) => {
 *     // Handler com contexto RLS ativo
 *     return NextResponse.next();
 *   }
 * );
 */
export function withRLSMiddleware<T>(
  getUser: (context: T) => RLSUser | null,
  handler: (context: T, user: RLSUser | null) => unknown
) {
  return async (context: T) => {
    const user = getUser(context);

    if (user && !isValidRLSUser(user)) {
      logger.error('[RLS] Usuário inválido no middleware:', user);
      throw new Error('Invalid RLS user from middleware');
    }

    if (!user) {
      return handler(context, null);
    }

    try {
      return await runWithStore(user, async () => {
        return handler(context, user);
      });
    } finally {
      // AsyncLocalStorage.run() handles context scoping automatically.
    }
  };
}

/**
 * Helper para criar queries com filtro RLS automático.
 *
 * @example
 * // Sem RLS:
 * const matches = await prisma.match.findMany({ where: { createdByUserId: userId } });
 *
 * // Com RLS:
 * const matches = await withRLSFilter(
 *   prisma.match.findMany({ where: { /* outros filtros *\/ } }),
 *   (query) => ({ ...query, where: { ...query.where, createdByUserId: getRLSUser()?.id } })
 * );
 */
export function withRLSFilter<T extends { where?: Record<string, unknown> }>(
  query: T,
  applyFilter: (query: T) => T
): T {
  const user = getRLSUser();

  // Se não houver usuário ou for ADMIN, não aplica filtro
  if (!user || user.role === 'ADMIN') {
    return query;
  }

  // Aplica filtro baseado no role
  return applyFilter(query);
}
