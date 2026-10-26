/** Permissões atômicas do módulo de acesso (PLANO_FUNDACAO_PERFIS §5). */
export const PERMISSIONS = [
  'platform:users:manage',
  'platform:ct:manage',
  'platform:memberships:manage',
  'support:account:assist',
  'platform:player:merge',
  'audit:read',
  'ct:members:manage',
  'athlete:create',
  'athlete:search',
  'athlete:update',
  'match:create',
  'match:annotate',
  'guardian:link',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
