import { isBreakPoint, isGameBall, enrichPointsFromHistory } from '../scoring-logic';
import { derivePointSnapshot } from '../point-snapshot.logic';
import { computeLiveCounters } from '../live-counters.logic';
import { computeSetSummary } from '../set-summary-stats';
import type { ScoringState, HistoryEntry } from '../types';

function createMockState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 1, player2: 1, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: 1000,
    secondServe: false,
    ...overrides,
  };
}

describe('No-Ad 40/40 Decisive Point - Break Point & Game Point', () => {
  describe('isBreakPoint & isGameBall predicates', () => {
    it('detecta break point e game ball em 40/40 no modo BEST_OF_3_NO_AD', () => {
      const state = createMockState({ server: 'player1' });
      expect(isBreakPoint(state, 'BEST_OF_3_NO_AD')).toBe(true);
      expect(isGameBall(state, 'BEST_OF_3_NO_AD')).toBe(true);
    });

    it('detecta break point e game ball em 40/40 no modo SHORT_SET_2V2_NO_AD', () => {
      const state = createMockState({ server: 'player2' });
      expect(isBreakPoint(state, 'SHORT_SET_2V2_NO_AD')).toBe(true);
      expect(isGameBall(state, 'SHORT_SET_2V2_NO_AD')).toBe(true);
    });

    it('não marca break point nem game ball em 40/40 com vantagem tradicional (sem advantage)', () => {
      const state = createMockState({ server: 'player1' });
      expect(isBreakPoint(state, 'BEST_OF_3')).toBe(false);
      expect(isGameBall(state, 'BEST_OF_3')).toBe(false);
    });
  });

  describe('derivePointSnapshot & enrichPointsFromHistory', () => {
    it('derivePointSnapshot marca isBreakPoint e isGameBall como true quando format é No-Ad', () => {
      const state = createMockState({ server: 'player1' });
      const snapshot = derivePointSnapshot(state, 'BEST_OF_3_NO_AD');

      expect(snapshot.isBreakPoint).toBe(true);
      expect(snapshot.isGameBall).toBe(true);
    });

    it('enrichPointsFromHistory enriquece ponto da timeline com isBreakPoint e isGameBall true', () => {
      const state = createMockState({ server: 'player1' });
      const history: HistoryEntry[] = [
        {
          stateBefore: state,
          point: {
            winnerId: 'p2',
            type: 'WINNER',
            isFirstServe: true,
            isSecondServe: false,
            serverId: 'p1',
            timestamp: 2000,
          },
        },
      ];

      const points = enrichPointsFromHistory(history, 'p1', 'p2', 'BEST_OF_3_NO_AD');
      expect(points).toHaveLength(1);
      expect(points[0].isBreakPoint).toBe(true);
      expect(points[0].isGameBall).toBe(true);
    });
  });

  describe('computeLiveCounters & computeSetSummary', () => {
    it('contabiliza break point convertido e oportunidade no LiveCounters quando receiver vence no 40/40 No-Ad', () => {
      const state = createMockState({ server: 'player1' });
      const history: HistoryEntry[] = [
        {
          stateBefore: state,
          point: {
            winnerId: 'p2',
            type: 'WINNER',
            isFirstServe: true,
            isSecondServe: false,
            serverId: 'p1',
            timestamp: 2000,
          },
        },
      ];

      const points = enrichPointsFromHistory(history, 'p1', 'p2', 'BEST_OF_3_NO_AD');
      const counters = computeLiveCounters(points, 'BEST_OF_3_NO_AD');

      expect(counters.breakPoints.p2.total).toBe(1);
      expect(counters.breakPoints.p2.converted).toBe(1);
      expect(counters.breakPointsSaved.p1.total).toBe(1);
      expect(counters.breakPointsSaved.p1.saved).toBe(0);
    });

    it('contabiliza break point salvo quando sacador vence no 40/40 No-Ad', () => {
      const state = createMockState({ server: 'player1' });
      const history: HistoryEntry[] = [
        {
          stateBefore: state,
          point: {
            winnerId: 'p1',
            type: 'ACE',
            isFirstServe: true,
            isSecondServe: false,
            serverId: 'p1',
            timestamp: 2000,
          },
        },
      ];

      const points = enrichPointsFromHistory(history, 'p1', 'p2', 'BEST_OF_3_NO_AD');
      const counters = computeLiveCounters(points, 'BEST_OF_3_NO_AD');

      expect(counters.breakPoints.p2.total).toBe(1);
      expect(counters.breakPoints.p2.converted).toBe(0);
      expect(counters.breakPointsSaved.p1.total).toBe(1);
      expect(counters.breakPointsSaved.p1.saved).toBe(1);
    });

    it('computeSetSummary registra oportunidade e conversão de break point no 40/40 No-Ad', () => {
      const state = createMockState({ server: 'player1' });
      const history: HistoryEntry[] = [
        {
          stateBefore: state,
          point: {
            winnerId: 'p2',
            type: 'WINNER',
            isFirstServe: true,
            isSecondServe: false,
            serverId: 'p1',
            timestamp: 2000,
          },
        },
      ];

      const points = enrichPointsFromHistory(history, 'p1', 'p2', 'BEST_OF_3_NO_AD');
      const summary = computeSetSummary(points, 1, undefined, 'BEST_OF_3_NO_AD');

      expect(summary.player2.breakPointsOpportunities).toBe(1);
      expect(summary.player2.breakPointsConverted).toBe(1);
      expect(summary.player1.breakPointsFaced).toBe(1);
      expect(summary.player1.breakPointsSaved).toBe(0);
    });
  });
});
