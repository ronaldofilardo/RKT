jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { matchRow, scoreState, set, game } from './matchServiceTestKit';

const mockPrisma = prisma as any;

describe('matchService.transitionMatchState - CANNOT_FINISH validation', () => {
  it('deve retornar erro CANNOT_FINISH quando engine indica partida em andamento', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({ scoreState: { sets: [{ player1: 6, player2: 4 }], isFinished: false, winner: null } }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    const result = await transitionMatchState('m1', 'FINISHED');

    expect(result).toEqual({ error: 'CANNOT_FINISH: Motor de pontuação indica partida em andamento' });
  });
});

describe('matchService.transitionMatchState - SCORE_REGRESSION validation', () => {
  it('deve retornar erro SCORE_REGRESSION quando novo setsWon é inferior ao stored', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({ scoreState: { sets: [], setsWon: { player1: 1, player2: 0 }, isFinished: false, winner: null } }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, scoreState());

    expect(result).toEqual({ error: 'SCORE_REGRESSION: Placar não pode ser inferior ao estado atual' });
  });

  it('deve retornar erro SCORE_REGRESSION quando player2 setsWon é inferior', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({ scoreState: { sets: [], setsWon: { player1: 0, player2: 1 }, isFinished: false, winner: null } }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, scoreState());

    expect(result).toEqual({ error: 'SCORE_REGRESSION: Placar não pode ser inferior ao estado atual' });
  });

  it('deve permitir edição quando setsWon é igual mas o último set de games mudou', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({
        scoreState: scoreState({ sets: [set(3, 2)], currentGame: game(3, 3, { isDeuce: true, advantage: 'player1' }) }),
      }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    const newScoreState = scoreState({ sets: [set(3, 3)] });

    const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, newScoreState);

    expect(result).not.toEqual(
      expect.objectContaining({
        error: expect.stringContaining('SCORE_REGRESSION'),
      }),
    );
  });
});
