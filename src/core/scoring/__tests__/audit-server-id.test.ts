import { auditServerId } from '../../../../scripts/audit-server-id';

describe('auditServerId', () => {
  it('identifies divergent serverId in point logs correctly', async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      {
        id: 'match-divergent',
        format: 'MATCH_TB_10',
        player1Id: 'p1',
        player2Id: 'p2',
        initialServerId: 'p1',
        pointLog: [
          {
            id: 'pt-1',
            winnerId: 'p1',
            type: 'WINNER',
            serverId: 'p1', // Correct: p1 serves first point
            sequenceNumber: 1,
          },
          {
            id: 'pt-2',
            winnerId: 'p2',
            type: 'WINNER',
            serverId: 'p1', // Divergent: in TB10, after point 1, p2 must serve!
            sequenceNumber: 2,
          },
        ],
      },
      {
        id: 'match-consistent',
        format: 'MATCH_TB_10',
        player1Id: 'p1',
        player2Id: 'p2',
        initialServerId: 'p1',
        pointLog: [
          {
            id: 'pt-1',
            winnerId: 'p1',
            type: 'WINNER',
            serverId: 'p1',
            sequenceNumber: 1,
          },
          {
            id: 'pt-2',
            winnerId: 'p2',
            type: 'WINNER',
            serverId: 'p2', // Correct: p2 serves point 2
            sequenceNumber: 2,
          },
        ],
      },
    ]);

    const fakePrisma: any = {
      match: {
        findMany: mockFindMany,
      },
    };

    const summary = await auditServerId(fakePrisma);

    expect(summary.inspected).toBe(2);
    expect(summary.tb10Matches).toBe(2);
    expect(summary.totalPointsChecked).toBe(4);
    expect(summary.divergentPoints).toBe(1);
    expect(summary.matchesWithDivergentServer).toBe(1);
    expect(summary.details).toEqual([
      {
        matchId: 'match-divergent',
        format: 'MATCH_TB_10',
        totalPoints: 2,
        divergentPointsCount: 1,
      },
    ]);
  });
});
