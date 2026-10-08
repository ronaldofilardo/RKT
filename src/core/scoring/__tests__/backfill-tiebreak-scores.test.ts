import { backfillTiebreakScores } from '../../../../scripts/backfill-tiebreak-scores';

describe('backfillTiebreakScores', () => {
  it('deve identificar e atualizar partidas com sets 7-6 sem tiebreakScore', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({});
    const mockFindMany = jest.fn().mockResolvedValue([
      {
        id: 'match-1',
        format: 'BEST_OF_3',
        scoreState: {
          state: {
            sets: [{ player1: 7, player2: 6, isTiebreak: false, tiebreakScore: null }],
            currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
            server: 'player1',
            isFinished: true,
            winner: 'player1',
            setsWon: { player1: 1, player2: 0 },
          },
          history: [
            {
              point: { type: 'WINNER', serverId: 'p1', winnerId: 'p1' },
              stateBefore: {
                sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 6, player2: 5 } }],
                currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
                server: 'player1',
                isFinished: false,
                winner: null,
                setsWon: { player1: 0, player2: 0 },
              },
            },
          ],
        },
      },
      {
        id: 'match-2',
        format: 'BEST_OF_3',
        scoreState: {
          state: {
            sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
          },
        },
      },
    ]);

    const fakePrisma: any = {
      match: {
        findMany: mockFindMany,
        update: mockUpdate,
      },
    };

    const result = await backfillTiebreakScores(fakePrisma);

    expect(result.inspected).toBe(2);
    expect(result.updated).toBe(1);
    expect(result.errors).toBe(0);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'match-1' },
        data: expect.objectContaining({
          scoreState: expect.objectContaining({
            state: expect.objectContaining({
              sets: [
                expect.objectContaining({
                  player1: 7,
                  player2: 6,
                  tiebreakScore: { player1: 6, player2: 5 },
                }),
              ],
            }),
          }),
        }),
      }),
    );
  });
});
