import { computeAdvancedStats } from '../compute-stats';
import type { TimelinePoint } from '@/core/scoring/types';

function createMockPoint(overrides: Partial<TimelinePoint> = {}): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 15, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 1,
    rallyDetails: null,
    ...overrides,
  };
}

describe('Separation of statistical counters (D1 & D2)', () => {
  it('D1: ACE counts in aces and does NOT count as rally winner', () => {
    const points: TimelinePoint[] = [
      createMockPoint({
        pointNumber: 1,
        server: 'player1',
        winner: 'PLAYER_1',
        type: 'ACE',
        rallyLength: 1,
      }),
      createMockPoint({
        pointNumber: 2,
        server: 'player1',
        winner: 'PLAYER_1',
        type: 'WINNER',
        rallyLength: 3,
        rallyDetails: { tipo: 'winner', golpe: 'fh' } as any,
      }),
    ];

    const stats = computeAdvancedStats(points);

    // Serve stats: player1 has 1 ace
    expect(stats.serve.player1.aces).toBe(1);

    // Shots stats: player1 has 1 rally winner (the forehand), NOT 2!
    expect(stats.shots.player1.winners).toBe(1);
    expect(stats.shots.player1.winnersByStroke).toEqual({ fh: 1 });

    // Set breakdown: aces and winners are separate
    expect(stats.setBreakdown[0].p1Aces).toBe(1);
    expect(stats.setBreakdown[0].p1Winners).toBe(1);
  });

  it('D2: DOUBLE_FAULT counts in doubleFaults and does NOT count as stroke unforced error', () => {
    const points: TimelinePoint[] = [
      createMockPoint({
        pointNumber: 1,
        server: 'player1',
        winner: 'PLAYER_2',
        type: 'DOUBLE_FAULT',
        isFirstServe: false,
        isSecondServe: true,
        rallyLength: 1,
      }),
      createMockPoint({
        pointNumber: 2,
        server: 'player1',
        winner: 'PLAYER_2',
        type: 'UNFORCED_ERROR',
        rallyLength: 4,
        rallyDetails: { tipo: 'erro_nao_forcado', golpe: 'bh' } as any,
      }),
    ];

    const stats = computeAdvancedStats(points);

    // Serve stats: player1 has 1 double fault
    expect(stats.serve.player1.doubleFaults).toBe(1);

    // Shots stats: player1 has 1 stroke unforced error (backhand), NOT 2!
    expect(stats.shots.player1.unforcedErrors).toBe(1);
    expect(stats.shots.player1.unforcedErrorsByStroke).toEqual({ bh: 1 });

    // Set breakdown: total errors include DF of the server + 1 rally UFE = 2
    expect(stats.setBreakdown[0].p1Errors).toBe(2);
  });
});
