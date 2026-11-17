/**
 * Split de score-adjustment-mt-formats.test.ts — describe "BEST_OF_3 (no MT)":
 * isMatchTiebreakSet/Active sempre falsos, set 3 regular e validate sempre
 * válido. Asserções 1:1.
 */
import {
  isMatchTiebreakSet,
  validateMatchTiebreakComplete,
} from '@/hooks/use-session-manager.logic';
import { isMatchTiebreakActive } from '@/lib/matchConfig';
import { buildNewScoringState } from '@/hooks/useSessionManager.state-builder';
import { setResult } from './scoreAdjustmentTestKit';

describe('BEST_OF_3 (no MT)', () => {
  it('isMatchTiebreakSet: should never return true', () => {
    const setResults = [setResult(6, 4), setResult(3, 6)];
    expect(isMatchTiebreakSet(2, setResults, 'BEST_OF_3')).toBe(false);
  });

  it('isMatchTiebreakActive: always false', () => {
    expect(isMatchTiebreakActive('BEST_OF_3', 3, 1, 1)).toBe(false);
  });

  it('buildNewScoringState: set 3 should be regular (no MT)', () => {
    const setResults = [setResult(6, 4), setResult(3, 6), setResult(6, 4)];
    const state = buildNewScoringState({ setResults, server: 'player1', format: 'BEST_OF_3' });
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.sets[2].isTiebreak).toBe(false);
    expect(state.sets[2].tiebreakScore).toBeNull();
  });

  it('validateMatchTiebreakComplete: always valid (no MT)', () => {
    const setResults = [setResult(6, 4), setResult(3, 6)];
    const result = validateMatchTiebreakComplete(setResults, 'BEST_OF_3');
    expect(result.valid).toBe(true);
  });
});
