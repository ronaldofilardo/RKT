/**
 * Split de score-adjustment-mt-formats.test.ts — describe "MATCH_TB_10":
 * isMatchTiebreakSet/Active, buildNewScoringState completo/parcial, validate,
 * calculateSetsWon e partida real via engine.loadState. Asserções 1:1.
 */
import { ScoringEngine } from '@/core/scoring/engine';
import {
  isMatchTiebreakSet,
  calculateSetsWon,
  validateMatchTiebreakComplete,
} from '@/hooks/use-session-manager.logic';
import { isMatchTiebreakActive } from '@/lib/matchConfig';
import { buildNewScoringState } from '@/hooks/useSessionManager.state-builder';
import { finishedState, makeConfig, setResult, setScore } from './scoreAdjustmentTestKit';

describe('MATCH_TB_10', () => {
  it('isMatchTiebreakSet: set 1 (index 0) should always be MT', () => {
    const setResults = [setResult(8, 7, true)];
    expect(isMatchTiebreakSet(0, setResults, 'MATCH_TB_10')).toBe(true);
  });

  it('isMatchTiebreakActive: always true', () => {
    expect(isMatchTiebreakActive('MATCH_TB_10', 1, 0, 0)).toBe(true);
  });

  it('buildNewScoringState: should create MT for the only set', () => {
    const setResults = [setResult(0, 0, false, { player1: 10, player2: 7 })];
    const state = buildNewScoringState({ setResults, server: 'player1', format: 'MATCH_TB_10' });
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 1, player2: 0 });
  });

  it('buildNewScoringState: partial MT score', () => {
    const setResults = [setResult(0, 0, true, { player1: 8, player2: 7 })];
    const state = buildNewScoringState({ setResults, server: 'player2', format: 'MATCH_TB_10' });
    expect(state.isFinished).toBe(false);
    expect(state.winner).toBeNull();
  });

  it('validateMatchTiebreakComplete: valid MT', () => {
    const setResults = [setResult(0, 0, false, { player1: 12, player2: 10 })];
    const result = validateMatchTiebreakComplete(setResults, 'MATCH_TB_10');
    expect(result.valid).toBe(true);
  });

  it('validateMatchTiebreakComplete: partial MT is valid', () => {
    const setResults = [setResult(0, 0, true, { player1: 8, player2: 7 })];
    const result = validateMatchTiebreakComplete(setResults, 'MATCH_TB_10');
    expect(result.valid).toBe(true);
  });

  it('calculateSetsWon: should count MT sets correctly', () => {
    const setResults = [setResult(0, 0, false, { player1: 10, player2: 8 })];
    const setsWon = calculateSetsWon(setResults, 'MATCH_TB_10');
    expect(setsWon).toEqual({ player1: 1, player2: 0 });
  });

  it('engine: full MT match via loadState', () => {
    const state = finishedState(
      [setScore(0, 0, true, { player1: 11, player2: 9 })],
      { player1: 1, player2: 0 },
      'player1',
      'player1'
    );
    const engine = new ScoringEngine(makeConfig('MATCH_TB_10'), state);
    expect(engine.isFinished()).toBe(true);
    expect(engine.getState().winner).toBe('player1');
  });
});
