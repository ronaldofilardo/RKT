/**
 * Split de set-completion.test.ts — describe "completeSet" (parte 1): setsWon
 * do vencedor, fim de partida por setsToWin (p1/p2), não-finalização, reset do
 * currentGame e alternância de servidor. Asserções 1:1.
 */
import { completeSet } from '../set-completion';
import { createBaseState, createConfig, setScore } from './setCompletionTestKit';

describe('completeSet', () => {
  it('deve incrementar setsWon do vencedor', () => {
    const state = createBaseState();
    const config = createConfig();
    const sets = [setScore(6, 4)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.setsWon.player1).toBe(1);
    expect(result.setsWon.player2).toBe(0);
  });

  it('deve finalizar partida quando player1 atinge setsToWin', () => {
    const state = createBaseState({ setsWon: { player1: 1, player2: 0 } });
    const config = createConfig();
    const sets = [setScore(6, 3)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player1');
  });

  it('deve finalizar partida quando player2 atinge setsToWin', () => {
    const state = createBaseState({ setsWon: { player1: 0, player2: 1 } });
    const config = createConfig();
    const sets = [setScore(3, 6)];
    const result = completeSet('player2', sets[0], sets, 'player1', state, config);
    expect(result.isFinished).toBe(true);
    expect(result.winner).toBe('player2');
  });

  it('NÃO deve finalizar quando ninguém atingiu setsToWin', () => {
    const state = createBaseState();
    const config = createConfig();
    const sets = [setScore(6, 4)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.isFinished).toBe(false);
    expect(result.winner).toBeNull();
  });

  it('deve resetar currentGame para próximo set', () => {
    const state = createBaseState({
      currentGame: { player1: 3, player2: 2, isDeuce: false, advantage: null, secondServe: false },
    });
    const config = createConfig();
    const sets = [setScore(6, 4)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.currentGame.player1).toBe(0);
    expect(result.currentGame.player2).toBe(0);
  });

  it('deve alternar servidor', () => {
    const state = createBaseState({ server: 'player1' });
    const config = createConfig();
    const sets = [setScore(6, 4)];
    const result = completeSet('player1', sets[0], sets, 'player2', state, config);
    expect(result.server).toBe('player2');
  });
});
