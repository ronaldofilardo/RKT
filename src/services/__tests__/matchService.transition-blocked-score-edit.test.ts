jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { matchRow, scoreState, set, game } from './matchServiceTestKit';

const mockPrisma = prisma as any;

describe('matchService.transitionMatchState - allowScoreEdit bypass (Edit Score) - bloqueios', () => {
  it('deve BLOQUEAR reducao de setsWon mesmo com allowScoreEdit=true (protecao mantida)', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({ scoreState: scoreState({ setsWon: { player1: 1, player2: 0 } }) }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    const editScoreState = scoreState({ startedAt: Date.now() });

    const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, editScoreState, { allowScoreEdit: true });

    expect(result).toEqual({
      error: 'SCORE_REGRESSION: Placar não pode ser inferior ao estado atual',
    });
  });

  it('deve BLOQUEAR reducao de currentGame quando allowScoreEdit=false (comportamento legacy mantido)', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    const sets = [set(6, 1), set(5, 7), set(0, 2)];
    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({
        format: 'BEST_OF_5',
        scoreState: scoreState({ sets, setsWon: { player1: 1, player2: 1 }, currentGame: game(2, 3) }),
      }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    const editScoreState = scoreState({
      sets,
      setsWon: { player1: 1, player2: 1 },
      currentGame: game(0, 1),
      startedAt: Date.now(),
    });

    const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, editScoreState);

    expect(result).toEqual({
      error: 'SCORE_REGRESSION: Placar não pode ser inferior ao estado atual',
    });
  });
});
