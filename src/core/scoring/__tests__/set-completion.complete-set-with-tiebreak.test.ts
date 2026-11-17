/**
 * Split de set-completion.test.ts — describe "completeSetWithTiebreak":
 * games do vencedor no set, delegação ao completeSet e fim de partida via
 * tiebreak. Asserções 1:1.
 */
import { completeSetWithTiebreak } from '../set-completion';
import { createBaseState, createConfig, setScore } from './setCompletionTestKit';

describe('completeSetWithTiebreak', () => {
  it('deve incrementar games do vencedor no set', () => {
    const state = createBaseState({
      sets: [setScore(6, 6, true, { player1: 5, player2: 6 })],
    });
    const config = createConfig();
    const tbScore = { player1: 6, player2: 8 };
    const result = completeSetWithTiebreak('player2', tbScore, 'player1', state, config);
    expect(result.sets[0].player2).toBe(7);
    expect(result.sets[0].player1).toBe(6);
    expect(result.sets[0].tiebreakScore).toEqual(tbScore);
    expect(result.sets[0].isTiebreak).toBe(false);
  });

  it('deve chamar completeSet internamente', () => {
    const state = createBaseState({
      sets: [setScore(6, 6, true, { player1: 6, player2: 5 })],
    });
    const config = createConfig();
    const tbScore = { player1: 8, player2: 6 };
    const result = completeSetWithTiebreak('player1', tbScore, 'player2', state, config);
    expect(result.setsWon.player1).toBe(1);
  });

  it('deve finalizar partida quando setsToWin é atingido via tiebreak', () => {
    const state = createBaseState({
      sets: [setScore(6, 6, true, { player1: 5, player2: 5 })],
      setsWon: { player1: 1, player2: 0 },
    });
    const config = createConfig();
    const tbScore = { player1: 7, player2: 5 };
    const result = completeSetWithTiebreak('player1', tbScore, 'player2', state, config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });
});
