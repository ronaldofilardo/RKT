import { AsyncLocalStorage } from 'async_hooks';
import { logger } from './logger';

export interface RLSUser {
  id: string;
  role: string;
}

const rlsStorage = new AsyncLocalStorage<RLSUser>();

const VALID_ROLES = ['ADMIN', 'GESTOR', 'COACH', 'ATHLETE', 'SPECTATOR'] as const;

function isValidRole(role: string): role is typeof VALID_ROLES[number] {
  return VALID_ROLES.includes(role as any);
}

function isValidRLSUser(user: RLSUser | null): user is RLSUser {
  if (!user) return false;
  if (!user.id || typeof user.id !== 'string' || user.id.trim() === '') {
    return false;
  }
  if (!isValidRole(user.role)) {
    return false;
  }
  return true;
}

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
  return rlsStorage.getStore() ?? null;
}

/**
 * @deprecated Use `runWithRLS` em vez de `setRLSUser`. `enterWith` (sticky mode)
 * persiste o contexto após o evento atual, causando VAZAMENTO de contexto entre
 * requests HTTP concorrentes que compartilham a mesma task/microtask. Esta
 * função agora é um no-op que apenas avisa no console.
 *
 * Para cenários de teste characterization que precisam de side-effect sticky,
 * use `__setRLSUserForTesting` (exported apenas em NODE_ENV=test).
 */
export function setRLSUser(user: RLSUser | null): void {
  logger.warn(
    '[RLS] setRLSUser está deprecated e não faz mais nada. Use runWithRLS ou withRLSHandler.',
  );
  void user;
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
          rlsStorage.disable();
          return;
        }
        if (!isValidRLSUser(user)) {
          throw new Error('Invalid RLS user in __setRLSUserForTesting');
        }
        rlsStorage.enterWith(user);
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
        rlsStorage.disable();
      }
    : () => {
        throw new Error('__clearRLSUserForTesting é proibido fora de testes');
      };

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
    return await rlsStorage.run(user, fn);
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
    return rlsStorage.run(user, fn);
  } finally {
    // AsyncLocalStorage.run() handles context scoping automatically.
    // Do NOT call rlsStorage.disable() here — same reason as runWithRLS.
  }
}

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
  handler: (context: T, user: RLSUser | null) => any
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
      return await rlsStorage.run(user, async () => {
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
export function withRLSFilter<T extends { where?: Record<string, any> }>(
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
