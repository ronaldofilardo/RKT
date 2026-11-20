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
    'finance:subscriptions:read': ['P'],
    'finance:subscriptions:manage': ['P'],
    'finance:invoices:manage': ['P'],
    'finance:plans:manage': ['P'],
  },
  SUPORTE: {
    'platform:users:manage': ['NON_PLATFORM_TARGET'],
    'platform:memberships:manage': ['NON_PLATFORM_TARGET'],
    'support:account:assist': ['P'],
    'platform:player:merge': ['P'],
    'finance:subscriptions:read': ['P'],
    'finance:subscriptions:manage': ['P'],
    'finance:invoices:manage': ['P'],
  },
  GESTOR: {
    ...OPERATE,
    'report:view': ['ANY'],
    'platform:memberships:manage': ['CT'],
    'audit:read': ['CT'],
    'ct:members:manage': ['CT'],
    'athlete:update': ['CT'],
    'guardian:link': ['CT'],
    'ct:tournament:manage': ['CT'],
  },
  TREINADOR: {
    ...OPERATE,
    'report:view': ['ANY'],
    'athlete:update': ['CT', 'PROP'],
    'coach:athlete:follow': ['ANY'],
    'coach:athlete:list': ['ANY'],
    'coach:athlete:view': ['FOLLOW'],
  },
  ATLETA: {
    ...OPERATE,
    'report:view': ['ANY'],
    'athlete:update': ['SELF', 'PROP'],
    'guardian:link': ['SELF'],
    'coach:athlete:respond': ['SELF'],
    'coach:athlete:view': ['SELF'],
    'coach:athlete:list': ['ANY'],
  },
  RESPONSAVEL: {
    'report:view': ['ANY'],
    'coach:athlete:respond': ['RESP'],
    'guardian:link': ['RESP'],
    'coach:athlete:view': ['RESP'],
    'coach:athlete:list': ['ANY'],
  },
  OPERACIONAL: {
    ...OPERATE,
    'report:view': ['ANY'],
    'athlete:update': ['PROP'],
  },
};
