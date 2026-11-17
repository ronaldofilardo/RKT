/**
 * Split de game-processing.test.ts — describe "applyRegularPoint — No-Ad
 * scoring": deuce 3-3, ponto decisivo (sudden death) e game sem deuce.
 * Asserções 1:1.
 */
import { applyRegularPoint } from '../game-processing';
import { createBaseState, createConfig, createGame } from './gameProcessingTestKit';

describe('applyRegularPoint — No-Ad scoring', () => {
  it('deve marcar deuce quando 3-3 em formato No-Ad', () => {
    const state = createBaseState({ currentGame: createGame({ player1: 2, player2: 3 }) });
    const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
    const result = applyRegularPoint('player1', state, config);
    expect(result.currentGame.isDeuce).toBe(true);
    expect(result.currentGame.player1).toBe(3);
    expect(result.currentGame.player2).toBe(3);
  });

  it('deve vencer game no ponto decisivo (sudden death) em No-Ad', () => {
    const state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
    });
    const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
    const result = applyRegularPoint('player1', state, config);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player1).toBe(1);
    expect(result.currentGame.player1).toBe(0);
  });

  it('deve vencer game quando player2 vence ponto decisivo No-Ad', () => {
    const state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
    });
    const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
    const result = applyRegularPoint('player2', state, config);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player2).toBe(1);
  });

  it('deve vencer game com 4 pontos em No-Ad (sem deuce)', () => {
    const state = createBaseState({ currentGame: createGame({ player1: 3, player2: 0 }) });
    const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
    const result = applyRegularPoint('player1', state, config);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player1).toBe(1);
  });
});
