import { can } from '../can';
import { PERMISSIONS, type Permission } from '../permissions';
import type { Profile, Resource } from '../types';
import { CT, OTHER_CT, SINGLE } from './fixtures';

interface Allowed {
  ok: Resource | undefined;
  ko?: Resource;
}

const CT_IN: Resource = { ctId: CT };
const CT_OUT: Resource = { ctId: OTHER_CT };
const OWN: Resource = { ownerUserId: 'u-1' };
const OTHERS: Resource = { ownerUserId: 'u-9' };

/** Tabela esperada, escrita à mão a partir da matriz §5 do plano. */
const EXPECTED: Record<Profile, Partial<Record<Permission, Allowed>>> = {
  ADMIN: {
    'platform:users:manage': { ok: undefined },
    'platform:ct:manage': { ok: undefined },
    'platform:memberships:manage': { ok: undefined },
    'support:account:assist': { ok: undefined },
    'platform:player:merge': { ok: undefined },
    'audit:read': { ok: undefined },
  },
  SUPORTE: {
    'platform:memberships:manage': { ok: { targetsPlatform: false }, ko: { targetsPlatform: true } },
    'support:account:assist': { ok: undefined },
    'platform:player:merge': { ok: undefined },
    'audit:read': { ok: undefined },
    'guardian:link': { ok: undefined },
  },
  GESTOR: {
    'platform:memberships:manage': { ok: CT_IN, ko: CT_OUT },
    'audit:read': { ok: CT_IN, ko: CT_OUT },
    'ct:members:manage': { ok: CT_IN, ko: CT_OUT },
    'athlete:create': { ok: undefined },
    'athlete:search': { ok: undefined },
    'athlete:update': { ok: CT_IN, ko: CT_OUT },
    'match:create': { ok: undefined },
    'match:annotate': { ok: undefined },
    'guardian:link': { ok: CT_IN, ko: CT_OUT },
  },
  TREINADOR: {
    'athlete:create': { ok: undefined },
    'athlete:search': { ok: undefined },
    'athlete:update': { ok: CT_IN, ko: { ctId: OTHER_CT, ownerUserId: 'u-9' } },
    'match:create': { ok: undefined },
    'match:annotate': { ok: undefined },
    'guardian:link': { ok: CT_IN, ko: CT_OUT },
  },
  ATLETA: {
    'athlete:create': { ok: undefined },
    'athlete:search': { ok: undefined },
    'athlete:update': { ok: { playerId: 'p-self' }, ko: { playerId: 'p-other' } },
    'match:create': { ok: undefined },
    'match:annotate': { ok: undefined },
    'guardian:link': { ok: { playerId: 'p-self' }, ko: { playerId: 'p-other' } },
  },
  OPERACIONAL: {
    'athlete:create': { ok: undefined },
    'athlete:search': { ok: undefined },
    'athlete:update': { ok: OWN, ko: OTHERS },
    'match:create': { ok: undefined },
    'match:annotate': { ok: undefined },
  },
};

const PROFILES = Object.keys(SINGLE) as Profile[];

describe('can() — matriz exaustiva perfil × permissão', () => {
  for (const profile of PROFILES) {
    describe(profile, () => {
      for (const permission of PERMISSIONS) {
        const row = EXPECTED[profile][permission];
        if (!row) {
          it(`nega ${permission} (sem permissão)`, () => {
            const d = can(SINGLE[profile], permission, CT_IN);
            expect(d).toEqual({ allow: false, reason: 'no-permission' });
          });
          continue;
        }
        it(`permite ${permission} dentro do escopo`, () => {
          expect(can(SINGLE[profile], permission, row.ok).allow).toBe(true);
        });
        if (row.ko) {
          it(`nega ${permission} fora do escopo`, () => {
            const d = can(SINGLE[profile], permission, row.ko);
            expect(d).toEqual({ allow: false, reason: 'out-of-scope' });
          });
        }
      }
    });
  }
});
