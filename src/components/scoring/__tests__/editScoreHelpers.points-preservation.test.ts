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
    // Scenario: Floor has 0x1, user changes to 1x1 and selects 0x16 points
    // "16" is capped to 4 (AD) by parsePointValue
    const result = createSetEditData(
      1,  // p1Val - user changed from 0 to 1
      1,  // p2Val - user kept at 1
      false, // isSetTrulyCompleted - false, set is partial
      false, // hasTiebreak
      0,  // tiebreakP1Num
      0,  // tiebreakP2Num
      false, // isMatchTiebreakSet
      '0',  // p1Points - user selected 0
      '16', // p2Points - user selected 16 (capped to 4 = AD)
      { player1: 0, player2: 1 } // currentSets - floor value
    );

    expect(result.currentGamePoints).toBeDefined();
    expect(result.currentGamePoints?.player1).toBe(0); // "0" -> 0
    expect(result.currentGamePoints?.player2).toBe(4); // "16" -> 4 (AD)
  });

  it('should preserve game points when games match floor (no change)', () => {
    // Scenario: Floor has 1x1, user keeps 1x1 and selects 15x0 points
    const result = createSetEditData(
      1,  // p1Val - same as floor
      1,  // p2Val - same as floor
      false, // isSetTrulyCompleted
      false, // hasTiebreak
      0,  // tiebreakP1Num
      0,  // tiebreakP2Num
      false, // isMatchTiebreakSet
      '15', // p1Points - user selected 15
      '0',  // p2Points - user selected 0
      { player1: 1, player2: 1 } // currentSets - floor value
    );

    expect(result.currentGamePoints?.player1).toBe(1); // "15" -> 1
    expect(result.currentGamePoints?.player2).toBe(0); // "0" -> 0
  });

  it('should preserve AD points selection', () => {
    // Scenario: User selects AD for player1
    const result = createSetEditData(
      2,  // p1Val
      2,  // p2Val
      false, // isSetTrulyCompleted
      false, // hasTiebreak
      0,  // tiebreakP1Num
      0,  // tiebreakP2Num
      false, // isMatchTiebreakSet
      'AD', // p1Points - user selected AD
      '40', // p2Points - user selected 40
      { player1: 1, player2: 2 } // currentSets
    );

    expect(result.currentGamePoints?.player1).toBe(4); // "AD" -> 4
    expect(result.currentGamePoints?.player2).toBe(3); // "40" -> 3
  });

  it('should preserve DEUCE points selection', () => {
    // Scenario: User selects DEUCE
    const result = createSetEditData(
      3,  // p1Val
      3,  // p2Val
      false, // isSetTrulyCompleted
      false, // hasTiebreak
      0,  // tiebreakP1Num
      0,  // tiebreakP2Num
      false, // isMatchTiebreakSet
      'DEUCE', // p1Points
      'DEUCE', // p2Points
      { player1: 2, player2: 3 } // currentSets
    );

    expect(result.currentGamePoints?.player1).toBe(3); // "DEUCE" -> 3
    expect(result.currentGamePoints?.player2).toBe(3); // "DEUCE" -> 3
  });

  it('should handle empty string points as 0', () => {
    // Scenario: User leaves points at default empty/zero
    const result = createSetEditData(
      1,  // p1Val
      0,  // p2Val
      false, // isSetTrulyCompleted
      false, // hasTiebreak
      0,  // tiebreakP1Num
      0,  // tiebreakP2Num
      false, // isMatchTiebreakSet
      '', // p1Points - empty
      '', // p2Points - empty
      { player1: 0, player2: 0 } // currentSets
    );

    expect(result.currentGamePoints?.player1).toBe(0);
    expect(result.currentGamePoints?.player2).toBe(0);
  });

  it('should NOT include currentGamePoints when set is completed', () => {
    // Scenario: Set is completed (6x4), no current game points needed
    const result = createSetEditData(
      6,  // p1Val
      4,  // p2Val
      true, // isSetTrulyCompleted - set is complete
      false, // hasTiebreak
      0,  // tiebreakP1Num
      0,  // tiebreakP2Num
      false, // isMatchTiebreakSet
      '0',  // p1Points (should be ignored)
      '0',  // p2Points (should be ignored)
      { player1: 5, player2: 4 } // currentSets
    );

    expect(result.currentGamePoints).toBeUndefined();
    expect(result.isPartial).toBe(false);
  });

  it('should include tiebreakScore when set completed with tiebreak', () => {
    // Scenario: Set completed 7x6 with tiebreak
    const result = createSetEditData(
      7,  // p1Val
      6,  // p2Val
      true, // isSetTrulyCompleted
      true, // hasTiebreak
      7,  // tiebreakP1Num
      5,  // tiebreakP2Num
      false, // isMatchTiebreakSet
      '0',  // p1Points (ignored)
      '0',  // p2Points (ignored)
      { player1: 6, player2: 6 } // currentSets
    );

    expect(result.tiebreakScore).toEqual({ player1: 7, player2: 5 });
    expect(result.currentGamePoints).toBeUndefined();
  });

  it('should include tiebreakScore for match tiebreak set', () => {
    // Scenario: Match tiebreak set (10x8)
    const result = createSetEditData(
      10, // p1Val - actually the tiebreak score
      8,  // p2Val
      true, // isSetTrulyCompleted
      false, // hasTiebreak (not applicable for match TB)
      0,  // tiebreakP1Num
      0,  // tiebreakP2Num
      true, // isMatchTiebreakSet
      '0',  // p1Points (ignored)
      '0',  // p2Points (ignored)
      { player1: 9, player2: 8 } // currentSets
    );

    expect(result.tiebreakScore).toEqual({ player1: 10, player2: 8 });
    expect(result.currentGamePoints).toBeUndefined();
  });
});