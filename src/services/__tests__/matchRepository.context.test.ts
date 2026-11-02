import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockPrisma = {
  match: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

describe('listMatches Context Segregation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve filtrar por ctId null no modo PARTICULAR', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'PARTICULAR');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, ctId: null, createdByUserId: 'coach-1' },
      }),
    );
  });

  it('deve filtrar por ctId do clube no modo CT sem restringir createdByUserId', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'ct-rkt-123');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, ctId: 'ct-rkt-123' },
      }),
    );
  });

  it('deve incluir atletas seguidos no modo PARTICULAR com OR', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', 'PARTICULAR', ['player-followed-1']);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          OR: [
            { ctId: null, createdByUserId: 'coach-1' },
            { player1Id: { in: ['player-followed-1'] } },
            { player2Id: { in: ['player-followed-1'] } },
            { player1PartnerId: { in: ['player-followed-1'] } },
            { player2PartnerId: { in: ['player-followed-1'] } },
          ],
        },
      }),
    );
  });

  it('mantém comportamento legado sem contextId (filtra apenas por createdByUserId)', async () => {
    const { listMatches } = await import('@/services/matchRepository');
    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches(null, null, 20, 'coach-1', null);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, createdByUserId: 'coach-1' },
      }),
    );
  });
});

