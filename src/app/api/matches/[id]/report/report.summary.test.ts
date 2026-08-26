import { buildReportSummary } from './report.summary';
import type { TimelinePoint } from '@/core/scoring/types';

function point(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'ACE',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: null,
    pointDetails: {} as TimelinePoint['pointDetails'],
    ...overrides,
  };
}

describe('buildReportSummary', () => {
  it('separa eventos ofensivos e erros por responsável', () => {
    const points = [
      point({ type: 'ACE', winner: 'PLAYER_1' }),
      point({ type: 'WINNER', winner: 'PLAYER_1' }),
      point({ type: 'DOUBLE_FAULT', winner: 'PLAYER_1', server: 'player2' }),
      point({ type: 'UNFORCED_ERROR', winner: 'PLAYER_2', server: 'player1' }),
      point({ type: 'FORCED_ERROR', winner: 'PLAYER_1', server: 'player2', isBreakPoint: true }),
    ];

    const summary = buildReportSummary(points, {
      sets: [{ player1: 6, player2: 4, isTiebreak: false }],
    });

    expect(summary.totalPoints).toBe(5);
    expect(summary.player1.pointsWon).toBe(3);
    expect(summary.player1.aces).toBe(1);
    expect(summary.player1.winners).toBe(1);
    expect(summary.player1.unforcedErrors).toBe(1);
    expect(summary.player2.doubleFaults).toBe(1);
    expect(summary.player2.forcedErrors).toBe(1);
    expect(summary.sets).toEqual([{ player1: 6, player2: 4, isTiebreak: false }]);
  });
});
