/**
 * Re-export do canônico em `@/lib/ranking/rankingConstants`.
 *
 * Mantido como barrel para preservar compatibilidade de imports
 * (`@/app/match/new/rankingConstants`) enquanto migração acontece.
 *
 * Owner: @frontend
 *
 * DEPRECATED: prefira importar diretamente de `@/lib/ranking/rankingConstants`.
 */

export * from '@/lib/ranking/rankingConstants';
