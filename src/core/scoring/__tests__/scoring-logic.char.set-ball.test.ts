/**
 * Split de scoring-logic.characterization.test.ts — describe "isSetBall":
 * set inexistente/fora dos limites, margem de 2 games e placares de set.
 * Asserções 1:1.
 */
import { isSetBall } from '../scoring-logic';
import { createBaseState, setScore } from './scoringLogicTestKit';

describe('isSetBall', () => {
  it('returns false when set does not exist', () => {
    const state = createBaseState({ sets: [] });
    expect(isSetBall(state, 1)).toBe(false);
  });

  it('returns false when setNumber is out of bounds', () => {
    const state = createBaseState({ sets: [setScore(5, 4)] });
    expect(isSetBall(state, 2)).toBe(false);
    expect(isSetBall(state, 0)).toBe(false);
  });

  it('returns true for player1 at 5-4', () => {
    const state = createBaseState({ sets: [setScore(5, 4)] });
    expect(isSetBall(state, 1)).toBe(true);
  });

  it('returns true for player2 at 4-5', () => {
    const state = createBaseState({ sets: [setScore(4, 5)] });
    expect(isSetBall(state, 1)).toBe(true);
  });

  it('returns true for player1 at 6-4', () => {
    const state = createBaseState({ sets: [setScore(6, 4)] });
    expect(isSetBall(state, 1)).toBe(true);
  });

  it('returns true for player2 at 4-6', () => {
    const state = createBaseState({ sets: [setScore(4, 6)] });
    expect(isSetBall(state, 1)).toBe(true);
  });

  it('returns false at 5-5', () => {
    const state = createBaseState({ sets: [setScore(5, 5)] });
    expect(isSetBall(state, 1)).toBe(false);
  });

  it('returns false at 6-5 (no 2-game margin)', () => {
    const state = createBaseState({ sets: [setScore(6, 5)] });
    expect(isSetBall(state, 1)).toBe(false);
  });

  it('returns false at 5-6 (no 2-game margin)', () => {
    const state = createBaseState({ sets: [setScore(5, 6)] });
    expect(isSetBall(state, 1)).toBe(false);
  });
});
