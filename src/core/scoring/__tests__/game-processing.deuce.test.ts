/**
 * Split de game-processing.test.ts — describe "applyRegularPoint — deuce
 * scoring": vantagem, retorno ao deuce, game no deuce e alternâncias.
 * Asserções 1:1.
 */
import { applyRegularPoint } from '../game-processing';
import { createBaseState, createConfig, createGame } from './gameProcessingTestKit';

describe('applyRegularPoint — deuce scoring', () => {
  it('deve dar vantagem ao player1 no deuce', () => {
    const state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
    });
    const result = applyRegularPoint('player1', state, createConfig());
    expect(result.currentGame.advantage).toBe('player1');
  });

  it('deve voltar ao deuce quando player1 com vantagem perde ponto', () => {
    const state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true, advantage: 'player1' }),
    });
    const result = applyRegularPoint('player2', state, createConfig());
    expect(result.currentGame.advantage).toBeNull();
    expect(result.currentGame.isDeuce).toBe(true);
  });

  it('deve vencer game quando player1 com vantagem vence próximo ponto', () => {
    const state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true, advantage: 'player1' }),
    });
    const result = applyRegularPoint('player1', state, createConfig());
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player1).toBe(1);
  });

  it('deve dar vantagem ao player2 no deuce', () => {
    const state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
    });
    const result = applyRegularPoint('player2', state, createConfig());
    expect(result.currentGame.advantage).toBe('player2');
  });

  it('deve vencer game quando player2 com vantagem vence próximo ponto', () => {
    const state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true, advantage: 'player2' }),
    });
    const result = applyRegularPoint('player2', state, createConfig());
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player2).toBe(1);
  });

  it('deve manter deuce após múltiplos alternâncias', () => {
    let state = createBaseState({
      currentGame: createGame({ player1: 3, player2: 3, isDeuce: true }),
    });
    const config = createConfig();
    state = applyRegularPoint('player1', state, config);
    expect(state.currentGame.advantage).toBe('player1');
    state = applyRegularPoint('player2', state, config);
    expect(state.currentGame.advantage).toBeNull();
    expect(state.currentGame.isDeuce).toBe(true);
    state = applyRegularPoint('player2', state, config);
    expect(state.currentGame.advantage).toBe('player2');
    state = applyRegularPoint('player1', state, config);
    expect(state.currentGame.advantage).toBeNull();
    expect(state.currentGame.isDeuce).toBe(true);
  });
});
