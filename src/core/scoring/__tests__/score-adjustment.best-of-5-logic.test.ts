/**
 * Split de score-adjustment-mt-formats.test.ts — describe "BEST_OF_5" (lógica):
 * isMatchTiebreakSet nos sets 4/5 e isMatchTiebreakActive por placar de sets.
 * Asserções 1:1.
 */
import { isMatchTiebreakSet } from '@/hooks/use-session-manager.logic';
import { isMatchTiebreakActive } from '@/lib/matchConfig';
import { setResult } from './scoreAdjustmentTestKit';

describe('BEST_OF_5 — lógica de MT', () => {
  it('isMatchTiebreakSet: set 5 (index 4) should be MT when 2x2', () => {
    const setResults = [setResult(6, 4), setResult(3, 6), setResult(6, 4), setResult(4, 6), setResult(6, 6, true)];
    expect(isMatchTiebreakSet(4, setResults, 'BEST_OF_5')).toBe(true);
  });

  it('isMatchTiebreakSet: set 4 (index 3) should NOT be MT', () => {
    const setResults = [setResult(6, 4), setResult(3, 6), setResult(6, 4), setResult(4, 5, true)];
    expect(isMatchTiebreakSet(3, setResults, 'BEST_OF_5')).toBe(false);
  });

  it('isMatchTiebreakActive: set 5 when 2x2', () => {
    expect(isMatchTiebreakActive('BEST_OF_5', 5, 2, 2)).toBe(true);
  });

  it('isMatchTiebreakActive: set 4 when 1x2', () => {
    expect(isMatchTiebreakActive('BEST_OF_5', 4, 1, 2)).toBe(false);
  });

  it('isMatchTiebreakSet: set 4 (index 3) should NOT be MT when 3x0', () => {
    const setResults = [setResult(6, 4), setResult(6, 3), setResult(6, 2), setResult(3, 3, true)];
    expect(isMatchTiebreakSet(3, setResults, 'BEST_OF_5')).toBe(false);
  });
});
