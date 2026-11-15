jest.mock('@/lib/prisma', () => require('./matchServiceTestKit').createPrismaMock());

import { prisma } from '@/lib/prisma';
import { matchRow, scoreState, set, tbSet, game } from './matchServiceTestKit';

const mockPrisma = prisma as any;

describe('matchService.transitionMatchState - allowScoreEdit bypass (Edit Score)', () => {
  it('deve permitir reducao do currentGame quando allowScoreEdit=true (mesmo ultimo set)', async () => {
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

    const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, editScoreState, { allowScoreEdit: true });

    expect(result).not.toHaveProperty('error');
  });

  it('deve permitir reducao em tie-break quando allowScoreEdit=true', async () => {
    const { transitionMatchState } = await import('@/services/matchService');

    const baseSets = [set(6, 1), set(4, 6)];
    mockPrisma.match.findFirst.mockResolvedValue(
      matchRow({
        format: 'BEST_OF_3_MATCH_TB',
        scoreState: scoreState({ sets: [...baseSets, tbSet(8, 5)], setsWon: { player1: 1, player2: 1 } }),
      }),
    );
    mockPrisma.match.update.mockResolvedValue({ id: 'm1' });

    const editScoreState = scoreState({
      sets: [...baseSets, tbSet(2, 1)],
      setsWon: { player1: 1, player2: 1 },
      startedAt: Date.now(),
    });

    const result = await transitionMatchState('m1', 'IN_PROGRESS', undefined, editScoreState, { allowScoreEdit: true });

    // P1-6 fix + isTiebreakRegressing: correção do tiebreak (8-5 → 2-1)
    // com mesmo vencedor (player1) é permitida
    expect(result).not.toHaveProperty('error');
  });
});
