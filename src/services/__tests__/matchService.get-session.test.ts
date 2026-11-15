jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { FULL_MATCH_SELECT } from '@/services/match-repository-select.data';

const mockPrisma = prisma as any;

describe('matchService.getMatch', () => {
  it('deve buscar partida por id com jogadores', async () => {
    const { getMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'm1',
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
    });

    const result = await getMatch('m1');

    expect(mockPrisma.match.findFirst).toHaveBeenCalledWith({
      where: { id: 'm1', deletedAt: null },
      select: FULL_MATCH_SELECT,
    });
    expect(result?.player1.name).toBe('Player 1');
  });

  it('deve retornar null se partida não existe', async () => {
    const { getMatch } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(null);

    const result = await getMatch('nonexistent');

    expect(result).toBeNull();
  });
});

describe('matchService.findAbandonedSessionSnapshot', () => {
  it('deve encontrar sessão abandonada com snapshot', async () => {
    const { findAbandonedSessionSnapshot } = await import('@/services/matchService');

    mockPrisma.matchAnnotationSession.findFirst.mockResolvedValue({
      id: 's1',
      matchId: 'm1',
      status: 'ABANDONED',
      matchStateSnapshot: '{}',
    });

    const result = await findAbandonedSessionSnapshot('m1');

    expect(mockPrisma.matchAnnotationSession.findFirst).toHaveBeenCalledWith({
      where: {
        matchId: 'm1',
        status: 'ABANDONED',
        matchStateSnapshot: { not: null },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    expect(result).toBeTruthy();
  });
});
