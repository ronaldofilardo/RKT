import type { TimelinePoint } from '@/core/scoring/types';
import { computeServeStats, computeReturnStats } from '../serve-return-stats';

function createMockPoint(overrides: Partial<TimelinePoint>): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'POINT',
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
    ...overrides,
  };
}

describe('serve-return-stats characterization & break points', () => {
  it('correctly calculates break points faced and saved when server saves and loses break points', () => {
    // Player 1 serves 4 points total in this game. 3 of them are break points:
    // BP 1: P1 saves (winner P1)
    // BP 2: P1 saves (winner P1)
    // BP 3: P2 converts / P1 loses (winner P2)
    const points: TimelinePoint[] = [
      createMockPoint({
        pointNumber: 1,
        server: 'player1',
        isBreakPoint: false,
        winner: 'PLAYER_1',
        gamesScore: { player1: 0, player2: 0 },
      }),
      createMockPoint({
        pointNumber: 2,
        server: 'player1',
        isBreakPoint: true,
        winner: 'PLAYER_1',
        gamesScore: { player1: 0, player2: 0 },
      }),
      createMockPoint({
        pointNumber: 3,
        server: 'player1',
        isBreakPoint: true,
        winner: 'PLAYER_1',
        gamesScore: { player1: 0, player2: 0 },
      }),
      createMockPoint({
        pointNumber: 4,
        server: 'player1',
        isBreakPoint: true,
        winner: 'PLAYER_2',
        gamesScore: { player1: 0, player2: 1 },
      }),
    ];

    const stats = computeServeStats(points, 1);

    // Faced: should be all 3 break points where P1 was serving
    expect(stats.breakPointsFaced).toBe(3);
    // Saved: 2 break points won by P1
    expect(stats.breakPointsSaved).toBe(2);
    // Percentage: (2 / 3) * 100 = 66.666...%
    expect(stats.breakPointsSavedPct).toBeCloseTo((2 / 3) * 100);
  });

  it('handles 0 break points faced without division by zero', () => {
    const points: TimelinePoint[] = [
      createMockPoint({
        pointNumber: 1,
        server: 'player1',
        isBreakPoint: false,
        winner: 'PLAYER_1',
      }),
    ];

    const stats = computeServeStats(points, 1);
    expect(stats.breakPointsFaced).toBe(0);
    expect(stats.breakPointsSaved).toBe(0);
    expect(stats.breakPointsSavedPct).toBe(0);
  });

  it('correctly calculates return break points for opponent', () => {
    const points: TimelinePoint[] = [
      createMockPoint({
        pointNumber: 1,
        server: 'player1',
        isBreakPoint: true,
        winner: 'PLAYER_1', // P2 didn't convert
      }),
      createMockPoint({
        pointNumber: 2,
        server: 'player1',
        isBreakPoint: true,
        winner: 'PLAYER_2', // P2 converted
      }),
    ];

    const returnStatsP2 = computeReturnStats(points, 2);
    expect(returnStatsP2.breakPointOpportunities).toBe(2);
    expect(returnStatsP2.breakPointsConverted).toBe(1);
    expect(returnStatsP2.breakPointsConvertedPct).toBe(50);
  });

  describe('distinção infalível entre 1º e 2º saque', () => {
    it('garante que totalPoints é a soma exata de 1º e 2º saques, sem sobreposição nem perda', () => {
      // 10 pontos:
      // 6 pontos de 1º saque (4 vencidos, 2 perdidos)
      // 4 pontos de 2º saque (2 vencidos, 1 perdido, 1 dupla falta)
      const points: TimelinePoint[] = [
        // 1st serve points
        createMockPoint({ pointNumber: 1, isFirstServe: true, isSecondServe: false, winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 2, isFirstServe: true, isSecondServe: false, winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 3, isFirstServe: true, isSecondServe: false, winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 4, isFirstServe: true, isSecondServe: false, winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 5, isFirstServe: true, isSecondServe: false, winner: 'PLAYER_2' }),
        createMockPoint({ pointNumber: 6, isFirstServe: true, isSecondServe: false, winner: 'PLAYER_2' }),
        // 2nd serve points
        createMockPoint({ pointNumber: 7, isFirstServe: false, isSecondServe: true, winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 8, isFirstServe: false, isSecondServe: true, winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 9, isFirstServe: false, isSecondServe: true, winner: 'PLAYER_2' }),
        createMockPoint({ pointNumber: 10, type: 'DOUBLE_FAULT', isFirstServe: false, isSecondServe: true, winner: 'PLAYER_2' }),
      ];

      const stats = computeServeStats(points, 1);

      expect(stats.totalPoints).toBe(10);
      expect(stats.firstServeIn).toBe(6);
      expect(stats.firstServePct).toBe(60); // 6 / 10 = 60%
      expect(stats.firstServePointsWon).toBe(4);
      expect(stats.firstServePointsWonPct).toBeCloseTo((4 / 6) * 100);
      expect(stats.secondServePointsWon).toBe(2);
      expect(stats.secondServePointsWonPct).toBeCloseTo((2 / 4) * 100); // 2 / 4 = 50%
      expect(stats.doubleFaults).toBe(1);
    });

    it('trata DOUBLE_FAULT infalivelmente como 2º saque mesmo se flags booleanas estiverem ausentes ou ambíguas', () => {
      const points: TimelinePoint[] = [
        createMockPoint({
          pointNumber: 1,
          type: 'DOUBLE_FAULT',
          isFirstServe: true, // Flag corrompida/ambígua propositalmente
          isSecondServe: false,
          winner: 'PLAYER_2',
        }),
      ];

      const stats = computeServeStats(points, 1);
      expect(stats.totalPoints).toBe(1);
      expect(stats.firstServeIn).toBe(0);
      expect(stats.firstServePct).toBe(0);
      expect(stats.secondServePointsWon).toBe(0);
      expect(stats.secondServePointsWonPct).toBe(0);
      expect(stats.doubleFaults).toBe(1);
    });

    it('trata ponto com firstFault infalivelmente como 2º saque', () => {
      const points: TimelinePoint[] = [
        createMockPoint({
          pointNumber: 1,
          type: 'ACE',
          firstFault: { errorType: 'net' },
          isFirstServe: true, // Flag corrompida
          isSecondServe: false,
          winner: 'PLAYER_1',
        }),
      ];

      const stats = computeServeStats(points, 1);
      expect(stats.totalPoints).toBe(1);
      expect(stats.firstServeIn).toBe(0);
      expect(stats.firstServePct).toBe(0);
      expect(stats.secondServePointsWon).toBe(1);
      expect(stats.secondServePointsWonPct).toBe(100);
    });

    it('ignora FAULT_FIRST do cômputo de pontos totais finalizados mas o mantém fora do totalPoints', () => {
      const points: TimelinePoint[] = [
        createMockPoint({ pointNumber: 1, type: 'FAULT_FIRST', winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 2, isFirstServe: false, isSecondServe: true, winner: 'PLAYER_1' }),
      ];

      const stats = computeServeStats(points, 1);
      expect(stats.totalPoints).toBe(1);
      expect(stats.firstServeIn).toBe(0);
      expect(stats.secondServePointsWon).toBe(1);
    });
  });
});
