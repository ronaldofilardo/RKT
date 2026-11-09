import { filterFollowedPlayers } from '../access-actor.logic';
import { listPlayers } from '../player-service-queries.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findMany: jest.fn(),
    },
  },
}));

describe('Segregação de atletas de treinador por contexto (Clube vs Particular)', () => {
  const coachRow = {
    id: 'coach-1',
    role: 'TREINADOR',
    isActive: true,
    canOperate: true,
    memberships: [
      { kind: 'TREINADOR' as const, ctId: 'ct-alpha', status: 'ACTIVE' },
    ],
    athleteProfile: null,
    guardianLinks: [],
    coachAthleteLinks: [
      // Atleta 1: vinculado ao CT Alpha
      {
        playerId: 'player-ct-1',
        player: { playerCts: [{ ctId: 'ct-alpha', status: 'ACTIVE' }] },
      },
      // Atleta 2: particular (sem CT)
      {
        playerId: 'player-particular-2',
        player: { playerCts: [] },
      },
    ],
    createdPlayers: [
      // Atleta 3: criado no CT Alpha
      {
        id: 'player-ct-3',
        playerCts: [{ ctId: 'ct-alpha', status: 'ACTIVE' }],
      },
      // Atleta 4: criado como particular (sem CT)
      {
        id: 'player-particular-4',
        playerCts: [],
      },
    ],
  };

  it('quando o contexto for CT Alpha, retorna apenas atletas vinculados ao CT Alpha', () => {
    const followed = filterFollowedPlayers(coachRow, 'ct-alpha', 'TREINADOR_CLUBE');
    expect(followed).toEqual(['player-ct-1', 'player-ct-3']);
    expect(followed).not.toContain('player-particular-2');
    expect(followed).not.toContain('player-particular-4');
  });

  it('quando o contexto for PARTICULAR, retorna apenas atletas particulares do treinador', () => {
    const followed = filterFollowedPlayers(coachRow, 'PARTICULAR', 'TREINADOR_AVULSO');
    expect(followed).toEqual(['player-particular-2', 'player-particular-4']);
    expect(followed).not.toContain('player-ct-1');
    expect(followed).not.toContain('player-ct-3');
  });

  it('quando listPlayers recebe followedPlayerIds, filtra estritamente por esses IDs', async () => {
    (prisma.player.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 'player-particular-2', name: 'Atleta Particular 2' },
      { id: 'player-particular-4', name: 'Atleta Particular 4' },
    ]);

    const result = await listPlayers(null, 20, 'coach-1', ['player-particular-2', 'player-particular-4']);

    expect(prisma.player.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['player-particular-2', 'player-particular-4'] } },
      }),
    );
    expect(result).toHaveLength(2);
  });
});

