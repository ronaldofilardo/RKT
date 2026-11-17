/**
 * Split de scoring-logic.characterization.test.ts — describe "isGameBall":
 * 40-x/xx-40 no jogo comum, placares de tiebreak e match tiebreak. Asserções 1:1.
 */
import { isGameBall } from '../scoring-logic';
import { createBaseState, game, setScore } from './scoringLogicTestKit';

describe('isGameBall', () => {
  it('returns false at deuce', () => {
    expect(isGameBall(createBaseState({ currentGame: game(3, 3, { isDeuce: true }) }))).toBe(false);
  });

  it('returns true at 40-0 (3-0) for player1', () => {
    expect(isGameBall(createBaseState({ currentGame: game(3, 0) }))).toBe(true);
  });

  it('returns true at 0-40 (0-3) for player2', () => {
    expect(isGameBall(createBaseState({ currentGame: game(0, 3) }))).toBe(true);
  });

  it('returns true at 40-15 (3-1)', () => {
    expect(isGameBall(createBaseState({ currentGame: game(3, 1) }))).toBe(true);
  });

  it('returns true at 15-40 (1-3)', () => {
    expect(isGameBall(createBaseState({ currentGame: game(1, 3) }))).toBe(true);
  });

  it('returns false at 30-30 (2-2)', () => {
    expect(isGameBall(createBaseState({ currentGame: game(2, 2) }))).toBe(false);
  });

  it('returns true for tiebreak at 9-8 (player1)', () => {
    const state = createBaseState({ sets: [setScore(6, 6, true, { player1: 9, player2: 8 })] });
    expect(isGameBall(state)).toBe(true);
  });

  it('returns true for tiebreak at 8-9 (player2)', () => {
    const state = createBaseState({ sets: [setScore(6, 6, true, { player1: 8, player2: 9 })] });
    expect(isGameBall(state)).toBe(true);
  });

  it('returns false for tiebreak at 8-8', () => {
    const state = createBaseState({ sets: [setScore(6, 6, true, { player1: 8, player2: 8 })] });
    expect(isGameBall(state)).toBe(false);
  });

  it('returns false for tiebreak at 7-7', () => {
    const state = createBaseState({ sets: [setScore(6, 6, true, { player1: 7, player2: 7 })] });
    expect(isGameBall(state)).toBe(false);
  });

  it('returns true for match tiebreak at 9-8', () => {
    const state = createBaseState({ sets: [setScore(0, 0, true, { player1: 9, player2: 8 })] });
    expect(isGameBall(state)).toBe(true);
  });

  it('returns false for match tiebreak at 8-8', () => {
    const state = createBaseState({ sets: [setScore(0, 0, true, { player1: 8, player2: 8 })] });
    expect(isGameBall(state)).toBe(false);
  });

  it('returns false when set is tiebreak but no tiebreakScore', () => {
    const state = createBaseState({ sets: [setScore(6, 6, true)] });
    expect(isGameBall(state)).toBe(false);
  });
});
