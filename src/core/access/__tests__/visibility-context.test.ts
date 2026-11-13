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

  const gestorActorCtA: Actor = {
    userId: 'gestor-1',
    isActive: true,
    canOperate: true,
    memberships: [{ kind: 'GESTOR', ctId: 'ct-A', status: 'ACTIVE' }],
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

  const matchCtAOtherCoach = {
    ctId: 'ct-A',
    createdByUserId: 'coach-2',
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

  it('treinador enxerga apenas as próprias anotações (nunca as de outro treinador do mesmo CT)', () => {
    expect(canReadMatch(coachActorCtA, matchCtA)).toBe(true);
    expect(canReadMatch(coachActorCtA, matchCtAOtherCoach)).toBe(false);
    expect(canReadMatch(coachActorCtA, matchCtB)).toBe(false);
    expect(canReadMatch(coachActorCtA, matchParticular)).toBe(true);
  });

  it('treinador no contexto Particular lê apenas suas próprias anotações', () => {
    expect(canReadMatch(coachActorParticular, matchParticular)).toBe(true);
    expect(canReadMatch(coachActorParticular, matchCtA)).toBe(true);
    expect(canReadMatch(coachActorParticular, matchCtB)).toBe(false);
  });

  it('gestor do CT A lê todas as anotações vinculadas ao CT A, mas não de outros CTs nem no modo Particular', () => {
    expect(canReadMatch(gestorActorCtA, matchCtA)).toBe(true);
    expect(canReadMatch(gestorActorCtA, matchCtAOtherCoach)).toBe(true);
    expect(canReadMatch(gestorActorCtA, matchCtB)).toBe(false);
    expect(canReadMatch({ ...gestorActorCtA, activeContextId: 'PARTICULAR' }, matchCtAOtherCoach)).toBe(false);
  });

  it('anotação respeita autoria e contexto ativo impedindo cross-CT e escrita alheia', () => {
    expect(canAnnotateMatch(coachActorCtA, matchCtA)).toBe(true);
    expect(canAnnotateMatch(coachActorCtA, matchCtAOtherCoach)).toBe(false);
    expect(canAnnotateMatch(coachActorCtA, matchCtB)).toBe(false);
    expect(canAnnotateMatch(coachActorParticular, matchCtA)).toBe(false);
    expect(canAnnotateMatch(coachActorParticular, matchParticular)).toBe(true);
  });
});
