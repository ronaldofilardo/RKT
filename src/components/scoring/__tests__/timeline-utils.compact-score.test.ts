/**
 * Split de timeline-utils.test.ts — describe "getCompactGameScoreLabel":
 * formatação do placar compacto (regular, deuce, AD e tiebreak). Asserções 1:1.
 */
import { getCompactGameScoreLabel } from '../timeline.logic';

describe('getCompactGameScoreLabel', () => {
  it('deve formatar score regular', () => {
    const point = { gameScore: { player1: 1, player2: 0 }, gameIsDeuce: false, gameAdvantage: null, isTiebreak: false } as any;
    expect(getCompactGameScoreLabel(point)).toBe('15x0');
  });

  it('deve formatar 40x40 em deuce', () => {
    const point = { gameScore: { player1: 3, player2: 3 }, gameIsDeuce: true, gameAdvantage: null, isTiebreak: false } as any;
    expect(getCompactGameScoreLabel(point)).toBe('40x40');
  });

  it('deve formatar AD para player1', () => {
    const point = { gameScore: { player1: 3, player2: 3 }, gameIsDeuce: true, gameAdvantage: 'player1', isTiebreak: false } as any;
    expect(getCompactGameScoreLabel(point)).toBe('ADx40');
  });

  it('deve formatar tiebreak', () => {
    const point = { gameScore: { player1: 5, player2: 3 }, gameIsDeuce: false, gameAdvantage: null, isTiebreak: true } as any;
    expect(getCompactGameScoreLabel(point)).toBe('5x3');
  });
});
