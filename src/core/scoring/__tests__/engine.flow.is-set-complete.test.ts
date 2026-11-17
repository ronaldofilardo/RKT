/**
 * Split de engine.flow.characterization.test.ts — describe "isSetComplete":
 * conclusão de set com tiebreak (margem 2, 10 pontos), SHORT_SET e PRO_SET_8.
 * Asserções 1:1.
 */
import { isSetComplete } from '../engine.flow';
import { createConfig, createSetScore } from './engineFlowTestKit';

describe('isSetComplete', () => {
  const config = createConfig('BEST_OF_3');

  it('returns true for tiebreak with 7+ points and 2 margin', () => {
    const set = createSetScore(7, 6, true, { player1: 7, player2: 5 });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(true);
  });

  it('returns false for tiebreak without 2 margin', () => {
    const set = createSetScore(7, 6, true, { player1: 7, player2: 6 });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(false);
  });

  it('uses 10 points for Match Tiebreak', () => {
    const configMT = createConfig('MATCH_TB_10');
    const set = createSetScore(1, 0, true, { player1: 10, player2: 8 });
    expect(isSetComplete(set, { player1: 0, player2: 0 }, configMT, [set])).toBe(true);
  });

  it('uses 6 games with 2 margin for SHORT_SET_2V2_NO_AD (4-2 ainda não encerra o set)', () => {
    const configShort = createConfig('SHORT_SET_2V2_NO_AD');
    const set62 = createSetScore(6, 2);
    const set42 = createSetScore(4, 2);
    expect(isSetComplete(set62, { player1: 0, player2: 0 }, configShort, [set62])).toBe(true);
    expect(isSetComplete(set42, { player1: 0, player2: 0 }, configShort, [set42])).toBe(false);
  });

  it('uses 8 games for PRO_SET_8', () => {
    const configPro = createConfig('PRO_SET_8');
    const set = createSetScore(8, 6);
    expect(isSetComplete(set, { player1: 0, player2: 0 }, configPro, [set])).toBe(true);
  });

  it('requires 2-game margin', () => {
    const set = createSetScore(6, 5);
    expect(isSetComplete(set, { player1: 0, player2: 0 }, config, [set])).toBe(false);
  });
});
