/**
 * Split de engine.characterization.test.ts — describe "applyPoint — regular
 * points": WINNER/ACE/erros pontuam e resetam o segundo saque. Asserções 1:1.
 */
import type { PointFlow } from '../types';
import { makeEngine } from './engineCharacterizationTestKit';

describe('applyPoint — regular points', () => {
  it('increments score for player1 on WINNER', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'WINNER', winnerId: 'p1', timestamp: Date.now() };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.player1).toBe(1);
    expect(state.currentGame.player2).toBe(0);
  });

  it('increments score for player2 on WINNER', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'WINNER', winnerId: 'p2', timestamp: Date.now() };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.player1).toBe(0);
    expect(state.currentGame.player2).toBe(1);
  });

  it('handles ACE type same as WINNER', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'ACE', winnerId: 'p1', timestamp: Date.now() };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.player1).toBe(1);
  });

  it('handles FORCED_ERROR type', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'FORCED_ERROR', winnerId: 'p2', timestamp: Date.now() };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.player2).toBe(1);
  });

  it('handles UNFORCED_ERROR type', () => {
    const engine = makeEngine();
    const flow: PointFlow = { type: 'UNFORCED_ERROR', winnerId: 'p1', timestamp: Date.now() };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.player1).toBe(1);
  });

  it('resets secondServe after valid point', () => {
    const engine = makeEngine();
    engine.applyPoint({ type: 'FAULT_FIRST', winnerId: 'p1', timestamp: Date.now(), firstFault: true });
    const flow: PointFlow = { type: 'WINNER', winnerId: 'p1', timestamp: Date.now() };
    const state = engine.applyPoint(flow);
    expect(state.currentGame.secondServe).toBe(false);
    expect(state.secondServe).toBe(false);
  });
});
