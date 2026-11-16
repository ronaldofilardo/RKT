import { isDirectlyInvolvedInMatch } from '../match-involvement';
import type { Actor, MatchAccess } from '../types';

describe('isDirectlyInvolvedInMatch', () => {
  const baseActor: Actor = {
    userId: 'u1',
    isActive: true,
    canOperate: true,
    memberships: [],
    athleteCtIds: [],
    guardianOfPlayerIds: [],
    followedPlayerIds: [],
  };

  const baseMatch: MatchAccess = {
    participantPlayerIds: ['p1', 'p2'],
    participantCtIds: ['ct-1'],
    annotatorUserIds: [],
    ctId: 'ct-1',
  };

  it('retorna false quando ator não é fornecido ou inativo', () => {
    expect(isDirectlyInvolvedInMatch(null, baseMatch)).toBe(false);
    expect(isDirectlyInvolvedInMatch({ ...baseActor, isActive: false }, baseMatch)).toBe(false);
  });

  it('retorna true quando o ator é o próprio atleta em quadra', () => {
    const actor: Actor = { ...baseActor, athletePlayerId: 'p1' };
    expect(isDirectlyInvolvedInMatch(actor, baseMatch)).toBe(true);
  });

  it('retorna true quando o ator é responsável legal de qualquer atleta participante', () => {
    const actor: Actor = { ...baseActor, guardianOfPlayerIds: ['p2'] };
    expect(isDirectlyInvolvedInMatch(actor, baseMatch)).toBe(true);
  });

  it('retorna true quando o ator é gestor do CT da partida', () => {
    const actor: Actor = {
      ...baseActor,
      memberships: [{ kind: 'GESTOR', ctId: 'ct-1', status: 'ACTIVE' }],
    };
    expect(isDirectlyInvolvedInMatch(actor, baseMatch)).toBe(true);
  });

  it('retorna true quando o ator é gestor do CT de um dos participantes', () => {
    const match: MatchAccess = { ...baseMatch, ctId: 'ct-other', participantCtIds: ['ct-2'] };
    const actor: Actor = {
      ...baseActor,
      memberships: [{ kind: 'GESTOR', ctId: 'ct-2', status: 'ACTIVE' }],
    };
    expect(isDirectlyInvolvedInMatch(actor, match)).toBe(true);
  });

  it('retorna true quando treinador acompanha um dos atletas participantes', () => {
    const actor: Actor = { ...baseActor, followedPlayerIds: ['p1'] };
    expect(isDirectlyInvolvedInMatch(actor, baseMatch)).toBe(true);
  });

  it('retorna false quando o usuário é terceiro externo sem vínculo direto', () => {
    const outsider: Actor = {
      ...baseActor,
      athletePlayerId: 'p99',
      guardianOfPlayerIds: ['p88'],
      followedPlayerIds: ['p77'],
      memberships: [{ kind: 'GESTOR', ctId: 'ct-99', status: 'ACTIVE' }],
    };
    expect(isDirectlyInvolvedInMatch(outsider, baseMatch)).toBe(false);
  });
});
