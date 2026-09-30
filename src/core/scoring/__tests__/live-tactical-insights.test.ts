import { computeLiveCounters, detectTacticalTrends } from '../live-tactical-insights';
import type { TimelinePoint } from '../types';

function createMockPoint(overrides: Partial<TimelinePoint>): TimelinePoint {
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
    rallyLength: 3,
    rallyDetails: null,
    pointDetails: {} as any,
    ...overrides,
  };
}

describe('live-tactical-insights', () => {
  describe('computeLiveCounters', () => {
    it('retorna zeros para lista vazia', () => {
      const counters = computeLiveCounters([]);
      expect(counters.aces.p1).toBe(0);
      expect(counters.doubleFaults.p2).toBe(0);
      expect(counters.breakPoints.p1.converted).toBe(0);
      expect(counters.unforcedErrors.p1).toBe(0);
    });

    it('calcula aces, duplas faltas e pontos totais corretamente', () => {
      const points: TimelinePoint[] = [
        createMockPoint({ server: 'player1', winner: 'PLAYER_1', type: 'ACE' }),
        createMockPoint({ server: 'player1', winner: 'PLAYER_2', type: 'DOUBLE_FAULT' }),
        createMockPoint({ server: 'player2', winner: 'PLAYER_2', type: 'ACE' }),
        createMockPoint({
          server: 'player2',
          winner: 'PLAYER_1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'bh' } as any,
        }),
      ];

      const counters = computeLiveCounters(points);
      expect(counters.aces.p1).toBe(1);
      expect(counters.aces.p2).toBe(1);
      expect(counters.doubleFaults.p1).toBe(1);
      expect(counters.doubleFaults.p2).toBe(0);
      expect(counters.totalPointsWon.p1).toBe(2);
      expect(counters.totalPointsWon.p2).toBe(2);
    });
  });

  describe('detectTacticalTrends', () => {
    it('retorna vazio se houver poucos pontos na partida', () => {
      const points = [
        createMockPoint({ setNumber: 1 }),
        createMockPoint({ setNumber: 1 }),
      ];
      const trends = detectTacticalTrends(points, 'Nadal', 'Alcaraz', 1);
      expect(trends).toEqual([]);
    });

    it('detecta fraqueza quando jogador comete >= 60% dos erros não forçados no Backhand', () => {
      // Cria 8 pontos onde Player 2 comete erro não forçado, 5 deles no Backhand
      const points: TimelinePoint[] = [
        createMockPoint({ pointNumber: 1, setNumber: 1, winner: 'PLAYER_1', server: 'player1' }),
        createMockPoint({ pointNumber: 2, setNumber: 1, winner: 'PLAYER_1', server: 'player1' }),
        // 5 erros não forçados de backhand cometidos por Player 2
        createMockPoint({
          pointNumber: 3,
          setNumber: 2,
          winner: 'PLAYER_1',
          server: 'player1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'bh' } as any,
        }),
        createMockPoint({
          pointNumber: 4,
          setNumber: 2,
          winner: 'PLAYER_1',
          server: 'player1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'bh' } as any,
        }),
        createMockPoint({
          pointNumber: 5,
          setNumber: 2,
          winner: 'PLAYER_1',
          server: 'player1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'bh' } as any,
        }),
        createMockPoint({
          pointNumber: 6,
          setNumber: 2,
          winner: 'PLAYER_1',
          server: 'player1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'bh' } as any,
        }),
        createMockPoint({
          pointNumber: 7,
          setNumber: 2,
          winner: 'PLAYER_1',
          server: 'player1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'bh' } as any,
        }),
        // 2 erros não forçados de forehand cometidos por Player 2
        createMockPoint({
          pointNumber: 8,
          setNumber: 2,
          winner: 'PLAYER_1',
          server: 'player1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'fh' } as any,
        }),
        createMockPoint({
          pointNumber: 9,
          setNumber: 2,
          winner: 'PLAYER_1',
          server: 'player1',
          type: 'UNFORCED_ERROR',
          rallyDetails: { golpe: 'fh' } as any,
        }),
      ];

      const trends = detectTacticalTrends(points, 'Nadal', 'Alcaraz', 2);
      expect(trends.length).toBeGreaterThan(0);
      const bhTrend = trends.find((t) => t.type === 'weakness' && t.playerSide === 'player2');
      expect(bhTrend).toBeDefined();
      expect(bhTrend?.title).toBe('Fraqueza no Backhand');
      expect(bhTrend?.message).toContain('Alcaraz');
      expect(bhTrend?.message).toContain('Backhand');
    });

    it('detecta alerta de instabilidade quando jogador comete >= 3 duplas faltas no set', () => {
      const points: TimelinePoint[] = [
        createMockPoint({ pointNumber: 1, setNumber: 1, server: 'player2', winner: 'PLAYER_1', type: 'DOUBLE_FAULT' }),
        createMockPoint({ pointNumber: 2, setNumber: 1, server: 'player2', winner: 'PLAYER_1', type: 'DOUBLE_FAULT' }),
        createMockPoint({ pointNumber: 3, setNumber: 1, server: 'player2', winner: 'PLAYER_1', type: 'DOUBLE_FAULT' }),
        createMockPoint({ pointNumber: 4, setNumber: 1, server: 'player1', winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 5, setNumber: 1, server: 'player1', winner: 'PLAYER_1' }),
        createMockPoint({ pointNumber: 6, setNumber: 1, server: 'player1', winner: 'PLAYER_1' }),
      ];

      const trends = detectTacticalTrends(points, 'Nadal', 'Alcaraz', 1);
      const dfTrend = trends.find((t) => t.type === 'alert' && t.playerSide === 'player2');
      expect(dfTrend).toBeDefined();
      expect(dfTrend?.title).toBe('Instabilidade no Saque');
    });
  });
});
