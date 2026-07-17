/**
 * Test for buildNewScoringState - current game points preservation
 * 
 * Bug: After adjusting the score in "Ajustar Placar" modal, the selected
 *      game points (e.g., 0x16) were not being preserved in the new scoring state.
 *      The screen would show 0x0 instead.
 * 
 * Root cause: In buildCurrentGame, the condition was inverted:
 *             `partialSet && !partialSet.isPartial ? 0 : ...`
 *             This returned 0 for completed sets and preserved points for partial sets,
 *             but the logic was backwards - it should preserve points ONLY for partial sets.
 * 
 * Fix: Changed condition to `partialSet?.isPartial === true` to correctly preserve
 *      game points only when the set is partial (incomplete).
 */

import { buildNewScoringState } from '../useSessionManager.state-builder';

describe('buildNewScoringState - Current Game Points Preservation', () => {
  it('should preserve game points when set is partial', () => {
    // Scenario: User adjusted score to 1x1 games with 15x30 points (traditional tennis)
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 1,
          p2Games: 1,
          isPartial: true, // Set is incomplete
          currentGamePoints: {
            player1: '15',
            player2: '30',
          },
        },
      ],
      server: 'player1',
      format: 'BEST_OF_3',
      partialSet: {
        p1Games: 1,
        p2Games: 1,
        isPartial: true,
        currentGamePoints: {
          player1: '15',
          player2: '30',
        },
      },
    });

    // parsePointValue converts "15" → 1, "30" → 2
    expect(result.currentGame.player1).toBe(1);
    expect(result.currentGame.player2).toBe(2);
  });

  it('should preserve tennis point format (0, 15, 30, 40, AD)', () => {
    // Scenario: User adjusted score with traditional tennis points
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 2,
          p2Games: 2,
          isPartial: true,
          currentGamePoints: {
            player1: '15', // String format
            player2: '40',
          },
        },
      ],
      server: 'player2',
      format: 'BEST_OF_3',
      partialSet: {
        p1Games: 2,
        p2Games: 2,
        isPartial: true,
        currentGamePoints: {
          player1: '15',
          player2: '40',
        },
      },
    });

    // parsePointValue converts "15" → 1, "40" → 3
    expect(result.currentGame.player1).toBe(1);
    expect(result.currentGame.player2).toBe(3);
  });

  it('should preserve AD and DEUCE points', () => {
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 3,
          p2Games: 3,
          isPartial: true,
          currentGamePoints: {
            player1: 'AD',
            player2: '40',
          },
        },
      ],
      server: 'player1',
      format: 'BEST_OF_3',
      partialSet: {
        p1Games: 3,
        p2Games: 3,
        isPartial: true,
        currentGamePoints: {
          player1: 'AD',
          player2: '40',
        },
      },
    });

    // parsePointValue converts "AD" → 4
    expect(result.currentGame.player1).toBe(4);
    expect(result.currentGame.player2).toBe(3);
  });

  it('should reset game points to 0 when set is completed', () => {
    // Scenario: Set is completed (6x4), no current game points needed
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 6,
          p2Games: 4,
          isPartial: false, // Set is complete
          // currentGamePoints should be ignored
          currentGamePoints: {
            player1: 15,
            player2: 30,
          },
        },
      ],
      server: 'player1',
      format: 'BEST_OF_3',
      partialSet: undefined, // No partial set
    });

    // Game points should be 0 for completed sets
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
  });

  it('should handle undefined currentGamePoints gracefully', () => {
    // Scenario: Partial set without currentGamePoints defined
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 1,
          p2Games: 0,
          isPartial: true,
          // currentGamePoints is undefined
        },
      ],
      server: 'player1',
      format: 'BEST_OF_3',
      partialSet: {
        p1Games: 1,
        p2Games: 0,
        isPartial: true,
        // currentGamePoints undefined
      },
    });

    // Should default to 0
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
  });

  it('should handle empty string currentGamePoints as 0', () => {
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 1,
          p2Games: 1,
          isPartial: true,
          currentGamePoints: {
            player1: '',
            player2: '',
          },
        },
      ],
      server: 'player1',
      format: 'BEST_OF_3',
      partialSet: {
        p1Games: 1,
        p2Games: 1,
        isPartial: true,
        currentGamePoints: {
          player1: '',
          player2: '',
        },
      },
    });

    // Empty string should be parsed as 0
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
  });

  it('should handle multiple sets with last one partial', () => {
    // Scenario: Two completed sets + one partial set
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 6,
          p2Games: 4,
          isPartial: false,
        },
        {
          p1Games: 3,
          p2Games: 6,
          isPartial: false,
        },
        {
          p1Games: 2,
          p2Games: 1,
          isPartial: true,
          currentGamePoints: {
            player1: '30',
            player2: '15',
          },
        },
      ],
      server: 'player1',
      format: 'BEST_OF_3',
      partialSet: {
        p1Games: 2,
        p2Games: 1,
        isPartial: true,
        currentGamePoints: {
          player1: '30',
          player2: '15',
        },
      },
    });

    // Should preserve points from partial set
    expect(result.currentGame.player1).toBe(2); // "30" → 2
    expect(result.currentGame.player2).toBe(1); // "15" → 1
    expect(result.setsWon.player1).toBe(1);
    expect(result.setsWon.player2).toBe(1);
  });

  it('should handle numeric point indices from engine', () => {
    // Scenario: Points come as numeric indices (0-4) from engine state
    const result = buildNewScoringState({
      setResults: [
        {
          p1Games: 1,
          p2Games: 1,
          isPartial: true,
          currentGamePoints: {
            player1: 2, // Internal index for "30"
            player2: 3, // Internal index for "40"
          },
        },
      ],
      server: 'player1',
      format: 'BEST_OF_3',
      partialSet: {
        p1Games: 1,
        p2Games: 1,
        isPartial: true,
        currentGamePoints: {
          player1: 2,
          player2: 3,
        },
      },
    });

    expect(result.currentGame.player1).toBe(2);
    expect(result.currentGame.player2).toBe(3);
  });
});