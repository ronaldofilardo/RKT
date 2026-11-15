jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { matchRow } from './matchServiceTestKit';

const mockPrisma = prisma as any;

describe('matchService.transitionMatchState', () => {
  it('deve retornar null se partida não existe', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(null);

    const result = await transitionMatchState('nonexistent', 'IN_PROGRESS');

    expect(result).toBeNull();
  });

  it('deve negar FINISHED sem scoreState', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(matchRow({ scoreState: null }));

    const result = await transitionMatchState('m1', 'FINISHED');

    expect(result).toEqual({ error: 'CANNOT_FINISH: Partida sem pontuação registrada' });
  });

  it('deve negar FINISHED sem initialServerId', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(matchRow({ scoreState: { sets: [] }, initialServerId: null }));

    const result = await transitionMatchState('m1', 'FINISHED');

    expect(result).toEqual({ error: 'MATCH_NOT_STARTED: Partida sem primeiro sacador definido' });
  });

  it('deve transitar para IN_PROGRESS com scoreState', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(matchRow({ state: 'SCHEDULED' }));
    mockPrisma.match.update.mockResolvedValue({ id: 'm1', state: 'IN_PROGRESS' });

    const scoreState = {
      sets: [], currentGame: { player1: 15, player2: 0 }, server: 'player1',
      isFinished: false, winner: null, setsWon: { player1: 0, player2: 0 }, startedAt: null,
    };

    await transitionMatchState('m1', 'IN_PROGRESS', undefined, scoreState);

    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ state: 'IN_PROGRESS', scoreState }) }),
    );
  });

  it('deve transitar para IN_PROGRESS', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(matchRow({ state: 'SCHEDULED', initialServerId: null }));
    mockPrisma.match.update.mockResolvedValue({ id: 'm1', state: 'IN_PROGRESS' });

    await transitionMatchState('m1', 'IN_PROGRESS', 'p1');

    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ state: 'IN_PROGRESS', initialServerId: 'p1' }) }),
    );
  });
});
