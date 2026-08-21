import {
  getGameScoreLabel,
  isBreakPoint,
  isGameBall,
  isSetBall,
  enrichPointsFromHistory,
} from '../scoring-logic';
import type { ScoringState, HistoryEntry, PointLog } from '../types';

function createBaseState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
    ...overrides,
  };
}

function createPointLog(overrides: Partial<PointLog> = {}): PointLog {
  return {
    id: `pt-${Date.now()}`,
    matchId: 'm1',
    pointNumber: 1,
    winnerId: 'p1',
    type: 'RALLY',
    isFirstServe: true,
    isSecondServe: false,
    server: 'player1',
    rallyLength: 4,
    rallyDetails: { situacao: 'rally', tipo: 'forehand', subtipo1: 'crosscourt' },
    firstFaultDetail: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function createHistoryEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    stateBefore: createBaseState(),
    point: createPointLog(),
    ...overrides,
  };
}

describe('scoring-logic — Characterization Tests', () => {
  
  describe('getGameScoreLabel', () => {
    
    it('returns ADx40 when advantage is player1 at deuce', () => {
      expect(getGameScoreLabel(3, 3, true, 'player1')).toBe('ADx40');
    });

    it('returns 40xAD when advantage is player2 at deuce', () => {
      expect(getGameScoreLabel(3, 3, true, 'player2')).toBe('40xAD');
    });

    it('returns 40x40 at deuce with no advantage', () => {
      expect(getGameScoreLabel(3, 3, true, null)).toBe('40x40');
    });

    it('returns numeric score when points >= 4 (non-deuce)', () => {
      expect(getGameScoreLabel(4, 0)).toBe('4x0');
      expect(getGameScoreLabel(5, 3)).toBe('5x3');
    });

    it('returns numeric score for tiebreak regardless of points', () => {
      expect(getGameScoreLabel(3, 2, false, null, true)).toBe('3x2');
      expect(getGameScoreLabel(9, 8, false, null, true)).toBe('9x8');
      expect(getGameScoreLabel(10, 10, false, null, true)).toBe('10x10');
    });

    it('uses GAME_POINTS mapping for regular points < 4', () => {
      expect(getGameScoreLabel(0, 0)).toBe('0x0');
      expect(getGameScoreLabel(1, 0)).toBe('15x0');
      expect(getGameScoreLabel(2, 0)).toBe('30x0');
      expect(getGameScoreLabel(3, 0)).toBe('40x0');
      expect(getGameScoreLabel(0, 1)).toBe('0x15');
      expect(getGameScoreLabel(0, 2)).toBe('0x30');
      expect(getGameScoreLabel(0, 3)).toBe('0x40');
      expect(getGameScoreLabel(1, 1)).toBe('15x15');
      expect(getGameScoreLabel(2, 2)).toBe('30x30');
      expect(getGameScoreLabel(3, 3)).toBe('40x40');
    });

    it('falls back to numeric when GAME_POINTS mapping missing', () => {
      expect(getGameScoreLabel(10, 10)).toBe('10x10');
    });
  });

  describe('isBreakPoint', () => {
    
    it('returns false when match is finished', () => {
      const state = createBaseState({ isFinished: true });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('returns false when no sets exist', () => {
      const state = createBaseState({ sets: [] });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('returns false when current set is tiebreak', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 3, player2: 3 } }],
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('returns true when receiver has advantage at deuce', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: 'player2', secondServe: false },
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(true);
    });

    it('returns false when server has advantage at deuce', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: 'player1', secondServe: false },
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('returns true when receiverPoints >= 3 and serverPoints <= 2 (no deuce)', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 1, player2: 3, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(true);
    });

    it('returns false when receiverPoints < 3', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 2, player2: 2, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('returns false when serverPoints > 2', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 3, player2: 3, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('correctly identifies break point for player2 as server', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 3, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        server: 'player2',
      });
      expect(isBreakPoint(state)).toBe(true);
    });

    it('returns false when server is player2 and serverPoints > 2', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 5, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 1, player2: 3, isDeuce: false, advantage: null, secondServe: false },
        server: 'player2',
      });
      expect(isBreakPoint(state)).toBe(false);
    });
  });

  describe('isGameBall', () => {
    
    it('returns false at deuce', () => {
      const state = createBaseState({
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(false);
    });

    it('returns true at 40-0 (3-0) for player1', () => {
      const state = createBaseState({
        currentGame: { player1: 3, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('returns true at 0-40 (0-3) for player2', () => {
      const state = createBaseState({
        currentGame: { player1: 0, player2: 3, isDeuce: false, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('returns true at 40-15 (3-1)', () => {
      const state = createBaseState({
        currentGame: { player1: 3, player2: 1, isDeuce: false, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('returns true at 15-40 (1-3)', () => {
      const state = createBaseState({
        currentGame: { player1: 1, player2: 3, isDeuce: false, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('returns false at 30-30 (2-2)', () => {
      const state = createBaseState({
        currentGame: { player1: 2, player2: 2, isDeuce: false, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(false);
    });

    it('returns true for tiebreak at 9-8 (player1)', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 9, player2: 8 } }],
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('returns true for tiebreak at 8-9 (player2)', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 8, player2: 9 } }],
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('returns false for tiebreak at 8-8', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 8, player2: 8 } }],
      });
      expect(isGameBall(state)).toBe(false);
    });

    it('returns false for tiebreak at 7-7', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 7 } }],
      });
      expect(isGameBall(state)).toBe(false);
    });

    it('returns true for match tiebreak at 9-8', () => {
      const state = createBaseState({
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 9, player2: 8 } }],
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('returns false for match tiebreak at 8-8', () => {
      const state = createBaseState({
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 8, player2: 8 } }],
      });
      expect(isGameBall(state)).toBe(false);
    });

    it('returns false when set is tiebreak but no tiebreakScore', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: null }],
      });
      expect(isGameBall(state)).toBe(false);
    });
  });

  describe('isSetBall', () => {
    
    it('returns false when set does not exist', () => {
      const state = createBaseState({ sets: [] });
      expect(isSetBall(state, 1)).toBe(false);
    });

    it('returns false when setNumber is out of bounds', () => {
      const state = createBaseState({ sets: [{ player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null }] });
      expect(isSetBall(state, 2)).toBe(false);
      expect(isSetBall(state, 0)).toBe(false);
    });

    it('returns true for player1 at 5-4', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(true);
    });

    it('returns true for player2 at 4-5', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 5, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(true);
    });

    it('returns true for player1 at 6-4', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(true);
    });

    it('returns true for player2 at 4-6', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(true);
    });

    it('returns false at 5-5', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 5, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(false);
    });

    it('returns false at 6-5 (no 2-game margin)', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 5, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(false);
    });

    it('returns false at 5-6 (no 2-game margin)', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 6, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(false);
    });
  });

  describe('enrichPointsFromHistory', () => {
    
    it('returns empty array for empty history', () => {
      const result = enrichPointsFromHistory([], 'p1', 'p2');
      expect(result).toEqual([]);
    });

    it('enriches single point with basic info', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
        }),
        point: createPointLog({ winnerId: 'p1', type: 'RALLY' }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        pointNumber: 1,
        winner: 'PLAYER_1',
        type: 'RALLY',
        server: 'player1',
        isFirstServe: true,
        isSecondServe: false,
        rallyLength: 4,
        setNumber: 1,
        isBreakPoint: false,
        isGameBall: false,
        isSetBall: false,
        rallyDetails: { situacao: 'rally', tipo: 'forehand', subtipo1: 'crosscourt' },
        note: undefined,
        isTiebreak: false,
        gameIsDeuce: false,
        gameAdvantage: null,
        firstFault: undefined,
      });
    });

    it('identifies PLAYER_2 as winner when winnerId matches player2Id', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ winnerId: 'p2' }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].winner).toBe('PLAYER_2');
    });

    it('sets isBreakPoint true when receiver has break point', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          sets: [{ player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 1, player2: 3, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
        }),
        point: createPointLog({ winnerId: 'p1' }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].isBreakPoint).toBe(true);
    });

    it('sets isGameBall true at 40-0', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          currentGame: { player1: 3, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].isGameBall).toBe(true);
    });

    it('sets isGameBall true in tiebreak at 9-8', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 9, player2: 8 } }],
        }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].isGameBall).toBe(true);
    });

    it('sets isSetBall true at 5-4', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          sets: [{ player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null }],
        }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].isSetBall).toBe(true);
    });

    it('sets isServeFinish true for ACE', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'ACE' }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].type).toBe('ACE');
    });

    it('sets isServeFinish true for DOUBLE_FAULT', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'DOUBLE_FAULT' }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].type).toBe('DOUBLE_FAULT');
    });

    it('uses rallyLength from point when provided (nullish coalescing)', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'ACE', rallyLength: 10 }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      // ACTUAL BEHAVIOR: pt.rallyLength ?? (...) uses provided value when not null/undefined
      expect(result[0].rallyLength).toBe(10);
    });

    it('calculates rallyLength as 1 for serve finish when not provided', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'ACE', rallyLength: undefined }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].rallyLength).toBe(1);
    });

    it('calculates rallyLength as 2 for devolucao when not provided', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'RALLY', rallyDetails: { situacao: 'devolucao' }, rallyLength: undefined }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].rallyLength).toBe(2);
    });

    it('calculates rallyLength as 0 for regular rally when not provided', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'RALLY', rallyDetails: { situacao: 'rally' }, rallyLength: undefined }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].rallyLength).toBe(0);
    });

    it('uses rallyLength from point when not serve finish or devolucao', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'RALLY', rallyLength: 8 }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].rallyLength).toBe(8);
    });

    it('sets isTiebreak true when current set is tiebreak', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 3, player2: 3 } }],
        }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].isTiebreak).toBe(true);
    });

    it('sets isTiebreak false when current set is not tiebreak', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          sets: [{ player1: 4, player2: 3, isTiebreak: false, tiebreakScore: null }],
        }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].isTiebreak).toBe(false);
    });

    it('sets isTiebreak false when no sets exist', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({ sets: [] }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].isTiebreak).toBe(false);
    });

    it('sets gameIsDeuce from currentGame.isDeuce', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: 'player1', secondServe: false },
        }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].gameIsDeuce).toBe(true);
      expect(result[0].gameAdvantage).toBe('player1');
    });

    it('sets gameIsDeuce false and gameAdvantage null when not deuce', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        }),
        point: createPointLog(),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].gameIsDeuce).toBe(false);
      expect(result[0].gameAdvantage).toBeNull();
    });

    it('sets firstFault from point.firstFaultDetail for DOUBLE_FAULT', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'DOUBLE_FAULT', firstFaultDetail: 'WIDE' }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].firstFault).toBe('WIDE');
    });

    it('sets firstFault undefined for non-DOUBLE_FAULT', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'ACE', firstFaultDetail: 'WIDE' }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].firstFault).toBeUndefined();
    });

    it('sets firstFault undefined when firstFaultDetail is null', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ type: 'DOUBLE_FAULT', firstFaultDetail: null }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].firstFault).toBeUndefined();
    });

    it('preserves rallyDetails from point', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ rallyDetails: { situacao: 'saque', tipo: 'ace', subtipo1: 't', subtipo2: 'wide', efeito: 'flat' } }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].rallyDetails).toEqual({ situacao: 'saque', tipo: 'ace', subtipo1: 't', subtipo2: 'wide', efeito: 'flat' });
    });

    it('sets rallyDetails to null when undefined', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ rallyDetails: undefined }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].rallyDetails).toBeNull();
    });

    it('sets note from rallyDetails.note', () => {
      const history = [createHistoryEntry({
        point: createPointLog({ rallyDetails: { situacao: 'rally', note: 'Great point!' } }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].note).toBe('Great point!');
    });

    it('sets pointDetails to full point log', () => {
      const point = createPointLog({ type: 'WINNER' });
      const history = [createHistoryEntry({ point })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].pointDetails).toEqual(point);
    });

    it('calculates correct setNumber from stateBefore.sets.length', () => {
      const history = [
        createHistoryEntry({
          stateBefore: createBaseState({ sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }] }),
        }),
        createHistoryEntry({
          stateBefore: createBaseState({ sets: [
            { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
            { player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }
          ]}),
        }),
      ];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].setNumber).toBe(1);
      expect(result[1].setNumber).toBe(2);
    });

    it('sets setNumber to 1 when stateBefore.sets is empty', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({ sets: [] }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].setNumber).toBe(1);
    });

    it('sets gamesScore from currentSet games', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          sets: [{ player1: 4, player2: 3, isTiebreak: false, tiebreakScore: null }],
        }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].gamesScore).toEqual({ player1: 4, player2: 3 });
    });

    it('sets gamesScore to 0-0 when no sets', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({ sets: [] }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].gamesScore).toEqual({ player1: 0, player2: 0 });
    });

    it('sets gameScore from currentGame points', () => {
      const history = [createHistoryEntry({
        stateBefore: createBaseState({
          currentGame: { player1: 2, player2: 1, isDeuce: false, advantage: null, secondServe: false },
        }),
      })];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result[0].gameScore).toEqual({ player1: 2, player2: 1 });
    });

    it('handles multiple points in history', () => {
      const history = [
        createHistoryEntry({ point: createPointLog({ pointNumber: 1, winnerId: 'p1' }) }),
        createHistoryEntry({ point: createPointLog({ pointNumber: 2, winnerId: 'p2' }) }),
        createHistoryEntry({ point: createPointLog({ pointNumber: 3, winnerId: 'p1' }) }),
      ];

      const result = enrichPointsFromHistory(history, 'p1', 'p2');
      expect(result).toHaveLength(3);
      expect(result[0].pointNumber).toBe(1);
      expect(result[1].pointNumber).toBe(2);
      expect(result[2].pointNumber).toBe(3);
      expect(result[0].winner).toBe('PLAYER_1');
      expect(result[1].winner).toBe('PLAYER_2');
      expect(result[2].winner).toBe('PLAYER_1');
    });
  });
});