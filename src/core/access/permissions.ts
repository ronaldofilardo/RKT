/** Permissões atômicas do módulo de acesso (PLANO_FUNDACAO_PERFIS §5). */
export const PERMISSIONS = [
  'platform:users:manage',
  'platform:ct:manage',
  'platform:memberships:manage',
  'support:account:assist',
  'platform:player:merge',
  'audit:read',
  'support:access:approve',
  'ct:members:manage',
  'ct:tournament:manage',
  'athlete:create',
  'athlete:search',
  'athlete:update',
  'match:create',
  'match:annotate',
  'guardian:link',
  'coach:athlete:follow',
  'coach:athlete:respond',
  'coach:athlete:view',
  'coach:athlete:list',
  'report:view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
