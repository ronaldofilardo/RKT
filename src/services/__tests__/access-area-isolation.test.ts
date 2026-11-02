import { buildActor, type ActorRow } from '../access-actor.logic';
import { canReadMatch } from '@/core/access/visibility';

describe('Isolamento por Área no Servidor (buildActor & canReadMatch)', () => {
  const baseRow: ActorRow = {
    id: 'user-coach-1',
    role: 'USER',
    isActive: true,
    canOperate: true,
    memberships: [
      { kind: 'TREINADOR', ctId: 'ct-clube-a', status: 'ACTIVE' },
      { kind: 'TREINADOR', ctId: null, status: 'ACTIVE' },
    ],
    athleteProfile: null,
    guardianLinks: [],
    coachAthleteLinks: [
      { playerId: 'player-ct-a', player: { playerCts: [{ ctId: 'ct-clube-a', status: 'ACTIVE' }] } },
      { playerId: 'player-avulso-1', player: { playerCts: [] } },
    ],
  };

  it('no contexto TREINADOR_AVULSO isola apenas atletas avulsos e nega partidas de CT', () => {
    const actor = buildActor(baseRow, new Date(), 'PARTICULAR', 'TREINADOR_AVULSO');
    expect(actor.memberships.every((m) => m.ctId === null)).toBe(true);
    expect(actor.followedPlayerIds).toContain('player-avulso-1');
    expect(actor.followedPlayerIds).not.toContain('player-ct-a');

    const matchCt = {
      ctId: 'ct-clube-a',
      annotatorUserIds: [],
      participantPlayerIds: ['player-ct-a'],
      participantCtIds: ['ct-clube-a'],
    };
    expect(canReadMatch(actor, matchCt)).toBe(false);

    const matchAvulsa = {
      ctId: null,
      annotatorUserIds: [],
      participantPlayerIds: ['player-avulso-1'],
      participantCtIds: [],
    };
    expect(canReadMatch(actor, matchAvulsa)).toBe(true);
  });

  it('no contexto TREINADOR_CLUBE isola estritamente o CT ativo', () => {
    const actor = buildActor(baseRow, new Date(), 'ct-clube-a', 'TREINADOR_CLUBE');
    expect(actor.memberships.every((m) => m.ctId === 'ct-clube-a')).toBe(true);
    expect(actor.followedPlayerIds).toContain('player-ct-a');
    expect(actor.followedPlayerIds).not.toContain('player-avulso-1');

    const matchOutroCt = {
      ctId: 'ct-clube-b',
      annotatorUserIds: [],
      participantPlayerIds: ['player-ct-b'],
      participantCtIds: ['ct-clube-b'],
    };
    expect(canReadMatch(actor, matchOutroCt)).toBe(false);

    const matchDoCt = {
      ctId: 'ct-clube-a',
      annotatorUserIds: [],
      participantPlayerIds: ['player-ct-a'],
      participantCtIds: ['ct-clube-a'],
    };
    expect(canReadMatch(actor, matchDoCt)).toBe(true);
  });

  it('no contexto ATLETA exclui vínculos de gestão e treinador', () => {
    const actor = buildActor(baseRow, new Date(), undefined, 'ATLETA');
    expect(actor.memberships.some((m) => m.kind === 'TREINADOR')).toBe(false);
    expect(actor.followedPlayerIds).toHaveLength(0);
  });
});

