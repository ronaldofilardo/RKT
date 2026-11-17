/**
 * Split de set-completion.test.ts — describe "isSetComplete" (No-Ad format):
 * SHORT_SET_2V2_NO_AD com 6+ games, sem 4 games (regra removida), diff < 2,
 * tiebreak 7-6 e BEST_OF_3_NO_AD. Asserções 1:1.
 */
import { isSetComplete } from '../set-completion';
import { createConfig, setScore } from './setCompletionTestKit';

describe('isSetComplete — No-Ad format', () => {
  it('deve retornar true para SHORT_SET_2V2_NO_AD com 6+ games e diff >= 2', () => {
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    const set62 = setScore(6, 2);
    const set75 = setScore(7, 5);
    expect(isSetComplete(set62, { player1: 0, player2: 0 }, config, [])).toBe(true);
    expect(isSetComplete(set75, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });

  it('deve retornar false para SHORT_SET_2V2_NO_AD com menos de 6 games (a regra de 4 games foi removida)', () => {
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    const set42 = setScore(4, 2);
    const set52 = setScore(5, 2);
    expect(isSetComplete(set42, { player1: 0, player2: 0 }, config, [])).toBe(false);
    expect(isSetComplete(set52, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar false para SHORT_SET_2V2_NO_AD com diff < 2 (6-5)', () => {
    const set = setScore(6, 5);
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar true para SHORT_SET_2V2_NO_AD decidido por tiebreak em 7-6', () => {
    const set = setScore(7, 6, false, { player1: 7, player2: 4 });
    const config = createConfig({ format: 'SHORT_SET_2V2_NO_AD' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });

  it('deve retornar true para BEST_OF_3_NO_AD com 6+ games e diff >= 2', () => {
    const set = setScore(6, 4);
    const config = createConfig({ format: 'BEST_OF_3_NO_AD' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });
});
