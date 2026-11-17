/**
 * Split de game-processing.test.ts — describe "onGameWon" (parte 1): games do
 * vencedor, reset do game, sacador, fim de set, tiebreak 6-6 e fim de partida.
 * Asserções 1:1.
 */
import { onGameWon } from '../game-processing';
import { createBaseState, createConfig, createGame, setScore } from './gameProcessingTestKit';

describe('onGameWon — games, servidor e conclusões', () => {
  it('deve incrementar games do vencedor no set atual', () => {
    const state = createBaseState({ sets: [setScore(2, 3)] });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 1 }), state, createConfig());
    expect(result.sets[0].player1).toBe(3);
  });

  it('deve resetar currentGame', () => {
    const state = createBaseState({ sets: [setScore(2, 3)] });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 1 }), state, createConfig());
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
    expect(result.currentGame.isDeuce).toBe(false);
    expect(result.currentGame.advantage).toBeNull();
  });

  it('deve alternar servidor', () => {
    const state = createBaseState({ server: 'player1', sets: [setScore(2, 3)] });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 1 }), state, createConfig());
    expect(result.server).toBe('player2');
  });

  it('deve finalizar set quando player1 atinge 6 games com diff >= 2', () => {
    const state = createBaseState({ sets: [setScore(5, 3)] });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 1 }), state, createConfig());
    expect(result.setsWon.player1).toBe(1);
  });

  it('deve iniciar tiebreak em 6-6', () => {
    const state = createBaseState({ sets: [setScore(5, 6)] });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 2 }), state, createConfig());
    expect(result.sets[0].isTiebreak).toBe(true);
    expect(result.sets[0].tiebreakScore).toEqual({ player1: 0, player2: 0 });
  });

  it('deve finalizar partida quando setsToWin é atingido', () => {
    const state = createBaseState({
      sets: [setScore(6, 4), setScore(5, 3)],
      setsWon: { player1: 1, player2: 0 },
    });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 1 }), state, createConfig());
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });
});
