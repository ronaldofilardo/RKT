import { logger } from './logger';
import type { RLSUser } from './rls-storage.logic';
import { isValidRLSUser, runWithStore } from './rls-storage.logic';
import { getRLSUser } from './rls-context';

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
