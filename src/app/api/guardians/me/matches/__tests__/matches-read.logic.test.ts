import { getGuardianMatches } from '../matches-read.logic';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    guardianLink: { findMany: jest.fn() },
    match: { findMany: jest.fn() },
  },
}));

describe('getGuardianMatches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna lista vazia quando o usuário não possui dependentes vinculados', async () => {
    (prisma.guardianLink.findMany as jest.Mock).mockResolvedValue([]);
    const res = await getGuardianMatches('u-parent');
    expect(res).toEqual([]);
    expect(prisma.match.findMany).not.toHaveBeenCalled();
  });

  it('retorna partidas dos dependentes com criador e anotador identificados', async () => {
    (prisma.guardianLink.findMany as jest.Mock).mockResolvedValue([
      { playerId: 'p-minor', player: { id: 'p-minor', name: 'Junior Silva' } },
    ]);

    (prisma.match.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'm-1',
        format: 'BEST_OF_3',
        state: 'SCHEDULED',
        scheduledAt: new Date('2026-11-20T14:00:00Z'),
        startedAt: null,
        finishedAt: null,
        createdAt: new Date('2026-11-16T10:00:00Z'),
        player1Id: 'p-minor',
        player2Id: 'p-opp',
        player1: { id: 'p-minor', name: 'Junior Silva' },
        player2: { id: 'p-opp', name: 'Adversario X' },
        createdByUser: { id: 'u-coach', name: 'Treinador Carlos' },
        assignedCoach: { id: 'u-coach', name: 'Treinador Carlos' },
        ct: { id: 'ct-1', name: 'Clube Pinheiros' },
      },
    ]);

    const res = await getGuardianMatches('u-parent');
    expect(res).toHaveLength(1);
    expect(res[0].dependentName).toBe('Junior Silva');
    expect(res[0].opponentName).toBe('Adversario X');
    expect(res[0].createdByName).toBe('Treinador Carlos');
    expect(res[0].annotatorName).toBe('Treinador Carlos');
    expect(res[0].trainingCenterName).toBe('Clube Pinheiros');
    expect(res[0].state).toBe('SCHEDULED');
  });
});
