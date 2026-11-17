/**
 * Split de set-completion.test.ts — describe "isSetComplete" (regras gerais):
 * margem de 2 e máx. 6 games, sets de tiebreak (regular e match TB 10+) e
 * tbMin=10 no 5º set de BEST_OF_5. Asserções 1:1.
 */
import { isSetComplete } from '../set-completion';
import { createConfig, setScore } from './setCompletionTestKit';

describe('isSetComplete', () => {
  it('deve retornar true quando diff >= 2 e maxGames >= 6 (BEST_OF_3)', () => {
    const set = setScore(6, 4);
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });

  it('deve retornar false quando diff < 2', () => {
    const set = setScore(5, 4);
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar false quando maxGames < 6', () => {
    const set = setScore(4, 2);
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar true para set de tiebreak quando TB válido', () => {
    const set = setScore(7, 6, true, { player1: 7, player2: 5 });
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(true);
  });

  it('deve retornar false para set de tiebreak quando TB ainda em andamento', () => {
    const set = setScore(6, 6, true, { player1: 5, player2: 4 });
    const config = createConfig({ format: 'BEST_OF_3' });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [])).toBe(false);
  });

  it('deve retornar true para match tiebreak (10+) em MATCH_TB_10', () => {
    const set = setScore(0, 0, true, { player1: 10, player2: 7 });
    const config = createConfig({ format: 'MATCH_TB_10' });
    const sets = [set];
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, sets)).toBe(true);
  });

  it('deve retornar false para match tiebreak quando diff < 2', () => {
    const set = setScore(0, 0, true, { player1: 10, player2: 9 });
    const config = createConfig({ format: 'MATCH_TB_10' });
    const sets = [set];
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, sets)).toBe(false);
  });

  it('deve usar tbMin=10 para match tiebreak no 5º set de BEST_OF_5', () => {
    const set = setScore(6, 6, true, { player1: 10, player2: 8 });
    const config = createConfig({ format: 'BEST_OF_5' });
    const sets = [
      setScore(6, 4),
      setScore(4, 6),
      setScore(6, 4),
      setScore(4, 6),
      set,
    ];
    expect(isSetComplete(set, { player1: 2, player2: 2 }, config, sets)).toBe(true);
  });
});
