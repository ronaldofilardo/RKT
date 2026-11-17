/**
 * Split de score-adjustment-mt-formats.test.ts — describe "SHORT_SET_2V2_NO_AD":
 * isMatchTiebreakSet/Active, buildNewScoringState, validate e calculateSetsWon.
 * Asserções 1:1.
 */
import {
  isMatchTiebreakSet,
  calculateSetsWon,
  validateMatchTiebreakComplete,
} from '@/hooks/use-session-manager.logic';
import { isMatchTiebreakActive } from '@/lib/matchConfig';
import { buildNewScoringState } from '@/hooks/useSessionManager.state-builder';
import { setResult } from './scoreAdjustmentTestKit';

describe('SHORT_SET_2V2_NO_AD', () => {
  it('isMatchTiebreakSet: set 3 (index 2) should be MT when 1x1', () => {
    const setResults = [setResult(4, 2), setResult(2, 4)];
    expect(isMatchTiebreakSet(2, setResults, 'SHORT_SET_2V2_NO_AD')).toBe(true);
  });

  it('isMatchTiebreakActive: set 3 when 1x1', () => {
    expect(isMatchTiebreakActive('SHORT_SET_2V2_NO_AD', 3, 1, 1)).toBe(true);
  });

  it('isMatchTiebreakSet: set 1 (index 0) should NOT be MT', () => {
    const setResults = [setResult(3, 1, true)];
    expect(isMatchTiebreakSet(0, setResults, 'SHORT_SET_2V2_NO_AD')).toBe(false);
  });

  it('buildNewScoringState: should create MT for set 3', () => {
    const setResults = [setResult(4, 2), setResult(2, 4), setResult(0, 0, false, { player1: 10, player2: 6 })];
    const state = buildNewScoringState({ setResults, server: 'player1', format: 'SHORT_SET_2V2_NO_AD' });
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 2, player2: 1 });
  });

  it('validateMatchTiebreakComplete: valid MT', () => {
    const setResults = [setResult(4, 2), setResult(2, 4), setResult(11, 9)];
    const result = validateMatchTiebreakComplete(setResults, 'SHORT_SET_2V2_NO_AD');
    expect(result.valid).toBe(true);
  });

  it('calculateSetsWon: should count MT sets correctly', () => {
    const setResults = [setResult(4, 2), setResult(1, 4), setResult(10, 8)];
    const setsWon = calculateSetsWon(setResults, 'SHORT_SET_2V2_NO_AD');
    expect(setsWon).toEqual({ player1: 2, player2: 1 });
  });
});
