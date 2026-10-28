import type { Actor, ActorMembership } from '../types';

export const CT = 'ct-1';
export const OTHER_CT = 'ct-2';

export function actor(over: Partial<Actor> = {}): Actor {
  return {
    userId: 'u-1',
    isActive: true,
    canOperate: false,
    memberships: [],
    athletePlayerId: null,
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
    ...over,
  };
}

export function member(
  kind: ActorMembership['kind'],
  extra: Partial<ActorMembership> = {},
): ActorMembership {
  return { kind, status: 'ACTIVE', ...extra };
}

/** Um ator com exatamente um perfil. */
export const SINGLE = {
  ADMIN: actor({ memberships: [member('PLATAFORMA', { preset: 'ADMIN' })] }),
  SUPORTE: actor({ memberships: [member('PLATAFORMA', { preset: 'SUPORTE' })] }),
  GESTOR: actor({ memberships: [member('GESTOR', { ctId: CT })] }),
  TREINADOR: actor({ memberships: [member('TREINADOR', { ctId: CT })], followedPlayerIds: ['p-1'] }),
  ATLETA: actor({ athletePlayerId: 'p-self' }),
  RESPONSAVEL: actor({ guardianOfPlayerIds: ['p-1'] }),
  OPERACIONAL: actor({ canOperate: true }),
} as const;
