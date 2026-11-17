/**
 * Split de game-processing.test.ts — describe "applyRegularPoint — standard
 * scoring (BEST_OF_3)": progressão de pontos, deuce 3-3, game e sacador.
 * Asserções 1:1.
 */
import { applyRegularPoint } from '../game-processing';
import { createBaseState, createConfig, createGame } from './gameProcessingTestKit';

describe('applyRegularPoint — standard scoring (BEST_OF_3)', () => {
  it('deve incrementar pontos do player1', () => {
    const result = applyRegularPoint('player1', createBaseState(), createConfig());
    expect(result.currentGame.player1).toBe(1);
    expect(result.currentGame.player2).toBe(0);
  });

  it('deve incrementar pontos do player2', () => {
    const result = applyRegularPoint('player2', createBaseState(), createConfig());
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(1);
  });

  it('deve progredir corretamente 0->1->2->3 (0-15-30-40)', () => {
    const config = createConfig();
    let state = createBaseState();
    state = applyRegularPoint('player1', state, config);
    expect(state.currentGame.player1).toBe(1);
    state = applyRegularPoint('player1', state, config);
    expect(state.currentGame.player1).toBe(2);
    state = applyRegularPoint('player1', state, config);
    expect(state.currentGame.player1).toBe(3);
  });

  it('deve ativar deuce quando 3-3', () => {
    const state = createBaseState({ currentGame: createGame({ player1: 2, player2: 3 }) });
    const result = applyRegularPoint('player1', state, createConfig());
    expect(result.currentGame.isDeuce).toBe(true);
    expect(result.currentGame.player1).toBe(3);
    expect(result.currentGame.player2).toBe(3);
  });

  it('deve vencer game quando player1 atinge 4 pontos com player2 < 3', () => {
    const state = createBaseState({ currentGame: createGame({ player1: 3, player2: 1 }) });
    const result = applyRegularPoint('player1', state, createConfig());
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player1).toBe(1);
  });

  it('deve vencer game quando player2 atinge 4 pontos com player1 < 3', () => {
    const state = createBaseState({ currentGame: createGame({ player1: 1, player2: 3 }) });
    const result = applyRegularPoint('player2', state, createConfig());
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player2).toBe(1);
  });

  it('deve alternar servidor após game', () => {
    const state = createBaseState({
      server: 'player1',
      currentGame: createGame({ player1: 3, player2: 1 }),
    });
    const result = applyRegularPoint('player1', state, createConfig());
    expect(result.server).toBe('player2');
  });
});
