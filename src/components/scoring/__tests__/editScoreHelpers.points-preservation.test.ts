/**
 * Test for createSetEditData - current game points preservation bug fix
 * 
 * Bug: When user opens "Ajustar Placar" modal, changes games from floor value
 *      (e.g., 0x1 → 1x1), and then selects game points (e.g., 0x16), the points
 *      were being zeroed out in the returned SetEditData.
 * 
 * Root cause: createSetEditData was checking if games changed compared to currentSets
 *             and zeroing out currentGamePoints. This prevented user from selecting
 *             points after changing games.
 * 
 * Fix: Always preserve the points selected by user in p1Points/p2Points parameters.
 *      The UI zeroes points when games change, but user can re-select them.
 */

import { createSetEditData } from '../edit-score-logic';

describe('createSetEditData - Current Game Points Preservation', () => {
  it('should preserve game points when user changes games from floor value', () => {
    const result = createSetEditData({
      p1Val: 1,
      p2Val: 1,
      isSetTrulyCompleted: false,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: false,
      p1Points: '0',
      p2Points: '16',
      currentSets: { player1: 0, player2: 1 }
    });

    expect(result.currentGamePoints).toBeDefined();
    expect(result.currentGamePoints?.player1).toBe(0);
    expect(result.currentGamePoints?.player2).toBe(4);
  });

  it('should preserve game points when games match floor (no change)', () => {
    const result = createSetEditData({
      p1Val: 1,
      p2Val: 1,
      isSetTrulyCompleted: false,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: false,
      p1Points: '15',
      p2Points: '0',
      currentSets: { player1: 1, player2: 1 }
    });

    expect(result.currentGamePoints?.player1).toBe(1);
    expect(result.currentGamePoints?.player2).toBe(0);
  });

  it('should preserve AD points selection', () => {
    const result = createSetEditData({
      p1Val: 2,
      p2Val: 2,
      isSetTrulyCompleted: false,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: false,
      p1Points: 'AD',
      p2Points: '40',
      currentSets: { player1: 1, player2: 2 }
    });

    expect(result.currentGamePoints?.player1).toBe(4);
    expect(result.currentGamePoints?.player2).toBe(3);
  });

  it('should preserve DEUCE points selection', () => {
    const result = createSetEditData({
      p1Val: 3,
      p2Val: 3,
      isSetTrulyCompleted: false,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: false,
      p1Points: 'DEUCE',
      p2Points: 'DEUCE',
      currentSets: { player1: 2, player2: 3 }
    });

    expect(result.currentGamePoints?.player1).toBe(3);
    expect(result.currentGamePoints?.player2).toBe(3);
  });

  it('should handle empty string points as 0', () => {
    const result = createSetEditData({
      p1Val: 1,
      p2Val: 0,
      isSetTrulyCompleted: false,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: false,
      p1Points: '',
      p2Points: '',
      currentSets: { player1: 0, player2: 0 }
    });

    expect(result.currentGamePoints?.player1).toBe(0);
    expect(result.currentGamePoints?.player2).toBe(0);
  });

  it('should NOT include currentGamePoints when set is completed', () => {
    const result = createSetEditData({
      p1Val: 6,
      p2Val: 4,
      isSetTrulyCompleted: true,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: false,
      p1Points: '0',
      p2Points: '0',
      currentSets: { player1: 5, player2: 4 }
    });

    expect(result.currentGamePoints).toBeUndefined();
    expect(result.isPartial).toBe(false);
  });

  it('should include tiebreakScore when set completed with tiebreak', () => {
    const result = createSetEditData({
      p1Val: 7,
      p2Val: 6,
      isSetTrulyCompleted: true,
      hasTiebreak: true,
      tiebreakP1Num: 7,
      tiebreakP2Num: 5,
      isMatchTiebreakSet: false,
      p1Points: '0',
      p2Points: '0',
      currentSets: { player1: 6, player2: 6 }
    });

    expect(result.tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(result.currentGamePoints).toBeUndefined();
  });

  it('should include tiebreakScore for match tiebreak set', () => {
    const result = createSetEditData({
      p1Val: 10,
      p2Val: 8,
      isSetTrulyCompleted: true,
      hasTiebreak: false,
      tiebreakP1Num: 0,
      tiebreakP2Num: 0,
      isMatchTiebreakSet: true,
      p1Points: '0',
      p2Points: '0',
      currentSets: { player1: 9, player2: 8 }
    });

    expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
    expect(result.currentGamePoints).toBeUndefined();
  });
});