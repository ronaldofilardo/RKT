/**
 * Split de score-adjustment-mt-formats.test.ts — describe "BEST_OF_3_MATCH_TB"
 * (lógica): isMatchTiebreakSet/isMatchTiebreakActive, validate e calculateSetsWon.
 * Asserções 1:1.
 */
import {
  isMatchTiebreakSet,
  calculateSetsWon,
  validateMatchTiebreakComplete,
} from '@/hooks/use-session-manager.logic';
import { isMatchTiebreakActive } from '@/lib/matchConfig';
import { setResult } from './scoreAdjustmentTestKit';

describe('BEST_OF_3_MATCH_TB — lógica de MT', () => {
  it('isMatchTiebreakSet: set 3 (index 2) should be MT when 1x1', () => {
    const setResults = [setResult(6, 4), setResult(3, 6)];
    expect(isMatchTiebreakSet(2, setResults, 'BEST_OF_3_MATCH_TB')).toBe(true);
  });

  it('isMatchTiebreakSet: set 1 (index 0) should NOT be MT', () => {
    const setResults = [setResult(3, 2, true)];
    expect(isMatchTiebreakSet(0, setResults, 'BEST_OF_3_MATCH_TB')).toBe(false);
  });

  it('isMatchTiebreakActive: set 3 when 1x1', () => {
    expect(isMatchTiebreakActive('BEST_OF_3_MATCH_TB', 3, 1, 1)).toBe(true);
  });

  it('isMatchTiebreakActive: set 1 when 0x0', () => {
    expect(isMatchTiebreakActive('BEST_OF_3_MATCH_TB', 1, 0, 0)).toBe(false);
  });

  it('validateMatchTiebreakComplete: valid MT (10x7)', () => {
    const setResults = [
      setResult(6, 4),
      setResult(3, 6),
      setResult(0, 0, false, { player1: 10, player2: 7 }),
    ];
    const result = validateMatchTiebreakComplete(setResults, 'BEST_OF_3_MATCH_TB');
    expect(result.valid).toBe(true);
  });

  it('validateMatchTiebreakComplete: incomplete MT (8x7)', () => {
    const setResults = [
      setResult(6, 4),
      setResult(3, 6),
      setResult(0, 0, true, { player1: 8, player2: 7 }),
    ];
    const result = validateMatchTiebreakComplete(setResults, 'BEST_OF_3_MATCH_TB');
    expect(result.valid).toBe(true); // partial is valid
  });

  it('calculateSetsWon: should count MT sets correctly', () => {
    const setResults = [
      setResult(6, 4),
      setResult(3, 6),
      setResult(0, 0, false, { player1: 12, player2: 10 }),
    ];
    const setsWon = calculateSetsWon(setResults, 'BEST_OF_3_MATCH_TB');
    expect(setsWon).toEqual({ player1: 2, player2: 1 });
  });
});
