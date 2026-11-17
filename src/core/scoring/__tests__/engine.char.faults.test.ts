/**
 * Split de engine.characterization.test.ts — describes "applyPoint — first serve
 * fault" e "applyPoint — double fault": segundo saque, preservação do servidor
 * e pontuação da dupla falta. Asserções 1:1.
 */
import type { PointFlow } from '../types';
import { makeEngine } from './engineCharacterizationTestKit';

describe('applyPoint — saques com falha', () => {
  describe('applyPoint — first serve fault', () => {
    it('sets secondServe true on first fault', () => {
      const engine = makeEngine();
      const flow: PointFlow = { type: 'FAULT_FIRST', winnerId: 'p1', timestamp: Date.now(), firstFault: true };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.secondServe).toBe(true);
      expect(state.secondServe).toBe(true);
      expect(state.currentGame.player1).toBe(0);
      expect(state.currentGame.player2).toBe(0);
    });

    it('preserves server on fault', () => {
      const engine = makeEngine();
      const flow: PointFlow = { type: 'FAULT_FIRST', winnerId: 'p1', timestamp: Date.now(), firstFault: true };
      engine.applyPoint(flow);
      expect(engine.getServer()).toBe('player1');
    });
  });

  describe('applyPoint — double fault', () => {
    it('awards point to winner and resets secondServe', () => {
      const engine = makeEngine();
      const flow: PointFlow = { type: 'DOUBLE_FAULT', winnerId: 'p2', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player2).toBe(1);
      expect(state.currentGame.secondServe).toBe(false);
      expect(state.secondServe).toBe(false);
    });

    it('awards point to player1 when p1 wins', () => {
      const engine = makeEngine();
      const flow: PointFlow = { type: 'DOUBLE_FAULT', winnerId: 'p1', timestamp: Date.now() };
      const state = engine.applyPoint(flow);
      expect(state.currentGame.player1).toBe(1);
    });
  });
});
