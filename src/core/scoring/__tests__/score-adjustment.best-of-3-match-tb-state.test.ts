/**
 * Split de score-adjustment-mt-formats.test.ts — describe "BEST_OF_3_MATCH_TB"
 * (estado): buildNewScoringState com MT completo/parcial e partida real via
 * engine.loadState. Asserções 1:1.
 */
import { ScoringEngine } from '@/core/scoring/engine';
import { buildNewScoringState } from '@/hooks/useSessionManager.state-builder';
import { finishedState, makeConfig, setResult, setScore } from './scoreAdjustmentTestKit';

describe('BEST_OF_3_MATCH_TB — estado de MT', () => {
  it('buildNewScoringState: should create MT for set 3', () => {
    const setResults = [
      setResult(6, 4),
      setResult(3, 6),
      setResult(0, 0, false, { player1: 10, player2: 7 }),
    ];
    const state = buildNewScoringState({ setResults, server: 'player1', format: 'BEST_OF_3_MATCH_TB' });
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 2, player2: 1 });
  });

  it('buildNewScoringState: should allow partial MT score', () => {
    const setResults = [
      setResult(6, 4),
      setResult(3, 6),
      setResult(0, 0, true, { player1: 8, player2: 7 }),
    ];
    const state = buildNewScoringState({ setResults, server: 'player2', format: 'BEST_OF_3_MATCH_TB' });
    expect(state.isFinished).toBe(false);
    expect(state.winner).toBeNull();
    expect(state.setsWon).toEqual({ player1: 1, player2: 1 });
  });

  it('engine: full match with MT via loadState', () => {
    const state = finishedState(
      [setScore(6, 4), setScore(3, 6), setScore(0, 0, true, { player1: 11, player2: 9 })],
      { player1: 2, player2: 1 },
      'player1',
      'player1'
    );
    const engine = new ScoringEngine(makeConfig('BEST_OF_3_MATCH_TB'), state);
    expect(engine.isFinished()).toBe(true);
    expect(engine.getState().winner).toBe('player1');
  });
});
