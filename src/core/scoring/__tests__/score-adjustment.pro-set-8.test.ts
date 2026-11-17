/**
 * Split de score-adjustment-mt-formats.test.ts — describe "PRO_SET_8":
 * isMatchTiebreakSet/Active sempre falsos, vitória regular de pro set e
 * validate sempre válido. Asserções 1:1.
 */
import {
  isMatchTiebreakSet,
  validateMatchTiebreakComplete,
} from '@/hooks/use-session-manager.logic';
import { isMatchTiebreakActive } from '@/lib/matchConfig';
import { buildNewScoringState } from '@/hooks/useSessionManager.state-builder';
import { setResult } from './scoreAdjustmentTestKit';

describe('PRO_SET_8', () => {
  it('isMatchTiebreakSet: should never return true', () => {
    const setResults = [setResult(7, 5)];
    expect(isMatchTiebreakSet(0, setResults, 'PRO_SET_8')).toBe(false);
  });

  it('isMatchTiebreakActive: always false', () => {
    expect(isMatchTiebreakActive('PRO_SET_8', 1, 0, 0)).toBe(false);
  });

  it('buildNewScoringState: regular pro set win', () => {
    const setResults = [setResult(8, 5)];
    const state = buildNewScoringState({ setResults, server: 'player1', format: 'PRO_SET_8' });
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
  });

  it('validateMatchTiebreakComplete: always valid (no MT)', () => {
    const setResults = [setResult(8, 5)];
    const result = validateMatchTiebreakComplete(setResults, 'PRO_SET_8');
    expect(result.valid).toBe(true);
  });
});
