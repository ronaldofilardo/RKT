/**
 * Split de engine.characterization.test.ts — describe "applyPoint — validation":
 * partida finalizada, winnerId inválido e flows sem validação de vencedor.
 * Asserções 1:1.
 */
import type { PointFlow } from '../types';
import { makeEngine } from './engineCharacterizationTestKit';

describe('applyPoint — validation', () => {
  it('throws MATCH_ALREADY_FINISHED when match is finished', () => {
    const engine = makeEngine();
    // force finished state by setting isFinished directly on internal state
    // but we can't access private, so we use loadState
    engine.loadState({
      sets: [{ player1: 2, player2: 0, isTiebreak: false, tiebreakScore: null }],
      currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: true,
      winner: 'player1',
      setsWon: { player1: 2, player2: 0 },
      startedAt: null,
      secondServe: false,
    });
    const flow: PointFlow = { type: 'WINNER', winnerId: 'p1', timestamp: Date.now() };
    expect(() => engine.applyPoint(flow)).toThrow('MATCH_ALREADY_FINISHED');
  });

  it('throws INVALID_WINNER when winnerId does not match players', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'WINNER', winnerId: 'invalid', timestamp: Date.now() };
    expect(() => engine.applyPoint(flow)).toThrow('INVALID_WINNER');
  });

  it('accepts FAULT_FIRST without winner validation', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'FAULT_FIRST', winnerId: 'invalid', timestamp: Date.now(), firstFault: true };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.secondServe).toBe(true);
    expect(state.secondServe).toBe(true);
  });

  it('accepts DOUBLE_FAULT without winner validation', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'DOUBLE_FAULT', winnerId: 'p2', timestamp: Date.now() };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.player2).toBe(1);
  });
});
