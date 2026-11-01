import { canReadMatch, canAnnotateMatch } from '../visibility';
import type { Actor } from '../types';

describe('Isolamento de Visibilidade por Contexto de Sessão', () => {
  const coachActorCtA: Actor = {
    userId: 'coach-1',
    isActive: true,
    canOperate: true,
    memberships: [{ kind: 'TREINADOR', ctId: 'ct-A', status: 'ACTIVE' }],
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: ['p-1'],
    activeContextId: 'ct-A',
  };

  const coachActorParticular: Actor = {
    userId: 'coach-1',
    isActive: true,
    canOperate: true,
    memberships: [{ kind: 'TREINADOR', ctId: null, status: 'ACTIVE' }],
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: ['p-private'],
    activeContextId: 'PARTICULAR',
  };

  const adminActor: Actor = {
    userId: 'admin-1',
    isActive: true,
    canOperate: true,
    memberships: [{ kind: 'PLATAFORMA', preset: 'ADMIN', ctId: null, status: 'ACTIVE' }],
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
    activeContextId: 'ct-A',
  };

  const matchCtA = {
    ctId: 'ct-A',
    createdByUserId: 'coach-1',
    annotatorUserIds: [],
    participantPlayerIds: ['p-1'],
    participantCtIds: ['ct-A'],
  };

  const matchCtB = {
    ctId: 'ct-B',
    createdByUserId: 'other-user',
    annotatorUserIds: [],
    participantPlayerIds: ['p-2'],
    participantCtIds: ['ct-B'],
  };

  const matchParticular = {
    ctId: null,
    createdByUserId: 'coach-1',
    annotatorUserIds: [],
    participantPlayerIds: ['p-private'],
    participantCtIds: [],
  };

  it('treinador no contexto CT A enxerga apenas partidas do CT A', () => {
    expect(canReadMatch(coachActorCtA, matchCtA)).toBe(true);
    expect(canReadMatch(coachActorCtA, matchCtB)).toBe(false);
    expect(canReadMatch(coachActorCtA, matchParticular)).toBe(false);
  });

  it('treinador no contexto Particular enxerga apenas partidas avulsas (ctId null)', () => {
    expect(canReadMatch(coachActorParticular, matchParticular)).toBe(true);
    expect(canReadMatch(coachActorParticular, matchCtA)).toBe(false);
    expect(canReadMatch(coachActorParticular, matchCtB)).toBe(false);
  });

  it('administrador de plataforma mantém visão de partidas mesmo com activeContextId', () => {
    expect(canReadMatch(adminActor, matchCtA)).toBe(true);
  });

  it('anotação respeita o contexto ativo impedindo cross-CT', () => {
    expect(canAnnotateMatch(coachActorCtA, matchCtA)).toBe(true);
    expect(canAnnotateMatch(coachActorCtA, matchCtB)).toBe(false);
    expect(canAnnotateMatch(coachActorParticular, matchCtA)).toBe(false);
    expect(canAnnotateMatch(coachActorParticular, matchParticular)).toBe(true);
  });
});

