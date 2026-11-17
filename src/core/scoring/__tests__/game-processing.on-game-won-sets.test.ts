/**
 * Split de game-processing.test.ts — describe "onGameWon" (parte 2): erro de
 * gameWinner inválido, criação/atualização de sets e tiebreak do 5º set em
 * BEST_OF_5. Asserções 1:1.
 */
import { onGameWon } from '../game-processing';
import { createBaseState, createConfig, createGame, setScore } from './gameProcessingTestKit';

describe('onGameWon — sets e validação', () => {
  it('deve lançar erro para gameWinner inválido', () => {
    const state = createBaseState({ sets: [setScore(2, 3)] });
    expect(() => {
      onGameWon('invalid' as any, createGame(), state, createConfig());
    }).toThrow('INVALID_GAME_WINNER');
  });

  it('deve criar novo set quando set atual já está completo', () => {
    const state = createBaseState({
      sets: [setScore(6, 4)],
      setsWon: { player1: 1, player2: 0 },
    });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 2 }), state, createConfig());
    expect(result.sets.length).toBe(2);
    expect(result.sets[1].player1).toBe(1);
  });

  it('deve criar primeiro set quando sets está vazio', () => {
    const state = createBaseState({ sets: [] });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 2 }), state, createConfig());
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player1).toBe(1);
  });

  it('deve atualizar o primeiro set existente quando sets já contém um set vazio 0-0', () => {
    const state = createBaseState({ sets: [setScore(0, 0)] });
    const result = onGameWon('player1', createGame({ player1: 3, player2: 2 }), state, createConfig());
    expect(result.sets).toHaveLength(1);
    expect(result.sets[0].player1).toBe(1);
    expect(result.sets[0].player2).toBe(0);
  });

  describe('BEST_OF_5', () => {
    it('deve iniciar tiebreak no 5º set quando 2-2 em sets e 6-6 em games', () => {
      const state = createBaseState({
        sets: [setScore(6, 4), setScore(4, 6), setScore(6, 4), setScore(4, 6), setScore(5, 6)],
        setsWon: { player1: 2, player2: 2 },
      });
      const config = createConfig({ format: 'BEST_OF_5' });
      const result = onGameWon('player1', createGame({ player1: 3, player2: 2 }), state, config);
      const fifthSet = result.sets[4];
      expect(fifthSet.isTiebreak).toBe(true);
      expect(fifthSet.tiebreakScore).toEqual({ player1: 0, player2: 0 });
    });
  });
});
