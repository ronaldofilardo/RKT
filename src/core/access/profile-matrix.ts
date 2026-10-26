import type { Permission } from './permissions';
import type { Profile, Scope } from './types';

type Row = Partial<Record<Permission, readonly Scope[]>>;

const OPERATE: Row = {
  'athlete:create': ['ANY'],
  'athlete:search': ['ANY'],
  'match:create': ['ANY'],
  'match:annotate': ['ANY'],
};

/** Matriz §5 como dados. Admin e Suporte não têm `match:*` (F3). */
export const PROFILE_MATRIX: Record<Profile, Row> = {
  ADMIN: {
    'platform:users:manage': ['P'],
    'platform:ct:manage': ['P'],
    'platform:memberships:manage': ['P'],
    'support:account:assist': ['P'],
    'platform:player:merge': ['P'],
    'audit:read': ['P'],
  },
  SUPORTE: {
    'platform:memberships:manage': ['NON_PLATFORM_TARGET'],
    'support:account:assist': ['P'],
    'platform:player:merge': ['P'],
    'audit:read': ['P'],
    'guardian:link': ['ANY'],
  },
  GESTOR: {
    ...OPERATE,
    'platform:memberships:manage': ['CT'],
    'audit:read': ['CT'],
    'ct:members:manage': ['CT'],
    'athlete:update': ['CT'],
    'guardian:link': ['CT'],
  },
  TREINADOR: {
    ...OPERATE,
    'athlete:update': ['CT', 'PROP'],
    'guardian:link': ['CT'],
  },
  ATLETA: {
    ...OPERATE,
    'athlete:update': ['SELF', 'PROP'],
    'guardian:link': ['SELF'],
  },
  OPERACIONAL: {
    ...OPERATE,
    'athlete:update': ['PROP'],
  },
};
