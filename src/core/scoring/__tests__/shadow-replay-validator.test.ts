import { runShadowReplayBatch } from '../../../../scripts/shadow-replay-validator';

describe('runShadowReplayBatch', () => {
  it('deve processar partidas finalizadas e contabilizar partidas coincidentes', async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      {
        id: 'm1',
        format: 'MATCH_TB_10',
        player1Id: 'p1',
        player2Id: 'p2',
        initialServerId: 'p1',
        scoreState: {
          state: {
            sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 1, player2: 0 } }],
            currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
            server: 'p2',
            isFinished: false,
            winner: null,
            setsWon: { player1: 0, player2: 0 },
          },
        },
        pointLogs: [
          {
            id: 'pt-1',
            winnerId: 'p1',
            type: 'WINNER',
            serverId: 'p1',
            annotations: null,
            sequenceNumber: 1,
            createdAt: new Date(),
          },
        ],
      },
    ]);

    const fakePrisma: any = {
      match: {
        findMany: mockFindMany,
      },
    };

    const summary = await runShadowReplayBatch(fakePrisma);

    expect(summary.inspected).toBe(1);
    expect(summary.errors).toBe(0);
  });
});
