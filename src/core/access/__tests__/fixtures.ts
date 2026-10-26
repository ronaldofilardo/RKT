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
  TREINADOR: actor({ memberships: [member('TREINADOR', { ctId: CT })] }),
  ATLETA: actor({ athletePlayerId: 'p-self' }),
  OPERACIONAL: actor({ canOperate: true }),
} as const;
