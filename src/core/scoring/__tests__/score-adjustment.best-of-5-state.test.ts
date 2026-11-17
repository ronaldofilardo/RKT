/**
 * Split de score-adjustment-mt-formats.test.ts — describe "BEST_OF_5" (estado):
 * buildNewScoringState com MT no set 5, validate e partida Grand Slam real via
 * engine.loadState. Asserções 1:1.
 */
import { ScoringEngine } from '@/core/scoring/engine';
import { validateMatchTiebreakComplete } from '@/hooks/use-session-manager.logic';
import { buildNewScoringState } from '@/hooks/useSessionManager.state-builder';
import { finishedState, makeConfig, setResult, setScore } from './scoreAdjustmentTestKit';

describe('BEST_OF_5 — estado de MT', () => {
  it('buildNewScoringState: should create MT for set 5', () => {
    const setResults = [
      setResult(6, 4),
      setResult(3, 6),
      setResult(6, 4),
      setResult(4, 6),
      setResult(0, 0, false, { player1: 12, player2: 10 }),
    ];
    const state = buildNewScoringState({ setResults, server: 'player2', format: 'BEST_OF_5' });
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.setsWon).toEqual({ player1: 3, player2: 2 });
  });

  it('engine: full Grand Slam with MT in set 5', () => {
    const state = finishedState(
      [
        setScore(6, 4),
        setScore(3, 6),
        setScore(6, 4),
        setScore(4, 6),
        setScore(0, 0, true, { player1: 13, player2: 11 }),
      ],
      { player1: 3, player2: 2 },
      'player2',
      'player1'
    );
    const engine = new ScoringEngine(makeConfig('BEST_OF_5'), state);
    expect(engine.isFinished()).toBe(true);
    expect(engine.getState().winner).toBe('player1');
  });

  it('validateMatchTiebreakComplete: valid MT in set 5', () => {
    const setResults = [setResult(6, 4), setResult(3, 6), setResult(6, 4), setResult(4, 6), setResult(11, 9)];
    const result = validateMatchTiebreakComplete(setResults, 'BEST_OF_5');
    expect(result.valid).toBe(true);
  });
});
