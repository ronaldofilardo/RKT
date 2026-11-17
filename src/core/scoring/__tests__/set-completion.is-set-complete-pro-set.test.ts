/**
 * Split de set-completion.test.ts — describe "isSetComplete" (PRO_SET_8):
 * vitória com 8+ games e margem de 2, e rejeição de 7-5 / 8-7. Asserções 1:1.
 */
import { isSetComplete } from '../set-completion';
import { createConfig, setScore } from './setCompletionTestKit';

describe('isSetComplete — PRO_SET_8', () => {
  it('deve retornar true quando maxGames >= 8 e diff >= 2', () => {
    const set = setScore(8, 6);
    const config = createConfig({ format: 'PRO_SET_8' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });

  it('deve retornar false quando maxGames < 8', () => {
    const set = setScore(7, 5);
    const config = createConfig({ format: 'PRO_SET_8' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar false quando diff < 2 mesmo com 8 games', () => {
    const set = setScore(8, 7);
    const config = createConfig({ format: 'PRO_SET_8' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });
});
