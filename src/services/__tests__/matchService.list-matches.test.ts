jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { BASE_MATCH_SELECT } from '@/services/match-repository-select.data';

const mockPrisma = prisma as any;

describe('matchService.listMatches', () => {
  it('deve listar partidas sem filtros', async () => {
    const { listMatches } = await import('@/services/matchService');

    mockPrisma.match.findMany.mockResolvedValue([
      { id: 'm1', state: 'SCHEDULED', player1: { id: 'p1', name: 'P1' }, player2: { id: 'p2', name: 'P2' } },
    ]);

    await listMatches(null, null, 20, 'user-1');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
        select: BASE_MATCH_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
  });

  it('deve filtrar por estado e usar cursor', async () => {
    const { listMatches } = await import('@/services/matchService');

    mockPrisma.match.findMany.mockResolvedValue([]);

    await listMatches('IN_PROGRESS', 'cursor-abc', 10, 'user-1');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 1,
        cursor: { id: 'cursor-abc' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        where: {
          deletedAt: null,
          state: 'IN_PROGRESS',
          OR: [
            { createdByUserId: 'user-1', isPublicTemplate: false, isTemplate: false },
            { isTemplate: true, createdByUserId: 'user-1' },
          ],
        },
      }),
    );
  });
});
