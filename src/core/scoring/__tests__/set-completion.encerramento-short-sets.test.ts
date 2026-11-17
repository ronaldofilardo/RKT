/**
 * Split de set-completion.test.ts — describe "completeSet — encerramento e
 * Sets Curtos 2/2": zerar currentGame no fim, empilhar set 2-2 após set 1,
 * empilhar MT quando 1x1 e não empilhar set vazio em formatos 0-0.
 * Asserções 1:1.
 */
import { completeSet } from '../set-completion';
import { createBaseState, createConfig, setScore } from './setCompletionTestKit';

describe('completeSet — encerramento e Sets Curtos 2/2', () => {
  it('deve zerar currentGame quando a partida termina (sem game residual)', () => {
    const state = createBaseState({
      setsWon: { player1: 1, player2: 0 },
      currentGame: { player1: 3, player2: 1, isDeuce: false, advantage: null, secondServe: false },
    });
    const config = createConfig();
    const sets = [setScore(6, 3)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.isFinished).toBe(true);
    expect(result.currentGame).toEqual({ player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false });
  });

  it('SHORT_SET_2V2_NO_AD: após o set 1 empilha o set 2 já em 2-2', () => {
    const state = createBaseState();
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    const sets = [setScore(6, 2)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.setsWon).toEqual({ player1: 1, player2: 0 });
    expect(result.sets).toHaveLength(2);
    expect(result.sets[1]).toEqual({ player1: 2, player2: 2, isTiebreak: false, tiebreakScore: null });
  });

  it('SHORT_SET_2V2_NO_AD: com 1x1 empilha o Match Tiebreak (e não um set 2-2)', () => {
    const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    const sets = [setScore(6, 2), setScore(2, 6)];
    const result = completeSet('player2', sets[1], sets, 'player1', state, config);
    expect(result.setsWon).toEqual({ player1: 1, player2: 1 });
    expect(result.sets).toHaveLength(3);
    expect(result.sets[2]).toMatchObject({ isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } });
  });

  it('formatos que iniciam em 0-0 não empilham set vazio ao completar o set', () => {
    const state = createBaseState();
    const config = createConfig({ format: 'BEST_OF_3' });
    const sets = [setScore(6, 4)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.sets).toHaveLength(1);
  });
});
