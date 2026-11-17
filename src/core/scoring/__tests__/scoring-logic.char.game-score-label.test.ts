/**
 * Split de scoring-logic.characterization.test.ts — describe "getGameScoreLabel":
 * deuce/AD, placar numérico, tiebreak e mapeamento GAME_POINTS. Asserções 1:1.
 */
import { getGameScoreLabel } from '../scoring-logic';

describe('getGameScoreLabel', () => {
  it('returns ADx40 when advantage is player1 at deuce', () => {
    expect(getGameScoreLabel(3, 3, true, 'player1')).toBe('ADx40');
  });

  it('returns 40xAD when advantage is player2 at deuce', () => {
    expect(getGameScoreLabel(3, 3, true, 'player2')).toBe('40xAD');
  });

  it('returns 40x40 at deuce with no advantage', () => {
    expect(getGameScoreLabel(3, 3, true, null)).toBe('40x40');
  });

  it('returns numeric score when points >= 4 (non-deuce)', () => {
    expect(getGameScoreLabel(4, 0)).toBe('4x0');
    expect(getGameScoreLabel(5, 3)).toBe('5x3');
  });

  it('returns numeric score for tiebreak regardless of points', () => {
    expect(getGameScoreLabel(3, 2, false, null, true)).toBe('3x2');
    expect(getGameScoreLabel(9, 8, false, null, true)).toBe('9x8');
    expect(getGameScoreLabel(10, 10, false, null, true)).toBe('10x10');
  });

  it('uses GAME_POINTS mapping for regular points < 4', () => {
    expect(getGameScoreLabel(0, 0)).toBe('0x0');
    expect(getGameScoreLabel(1, 0)).toBe('15x0');
    expect(getGameScoreLabel(2, 0)).toBe('30x0');
    expect(getGameScoreLabel(3, 0)).toBe('40x0');
    expect(getGameScoreLabel(0, 1)).toBe('0x15');
    expect(getGameScoreLabel(0, 2)).toBe('0x30');
    expect(getGameScoreLabel(0, 3)).toBe('0x40');
    expect(getGameScoreLabel(1, 1)).toBe('15x15');
    expect(getGameScoreLabel(2, 2)).toBe('30x30');
    expect(getGameScoreLabel(3, 3)).toBe('40x40');
  });

  it('falls back to numeric when GAME_POINTS mapping missing', () => {
    expect(getGameScoreLabel(10, 10)).toBe('10x10');
  });
});
