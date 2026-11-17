/**
 * Split de scoring-logic.characterization.test.ts — describe "isBreakPoint":
 * guarda de partida/set/tiebreak, vantagem do recebedor e pontos 40 vs 30.
 * Asserções 1:1.
 */
import { isBreakPoint } from '../scoring-logic';
import { createBaseState, game, setScore } from './scoringLogicTestKit';

describe('isBreakPoint', () => {
  it('returns false when match is finished', () => {
    expect(isBreakPoint(createBaseState({ isFinished: true }))).toBe(false);
  });

  it('returns false when no sets exist', () => {
    expect(isBreakPoint(createBaseState({ sets: [] }))).toBe(false);
  });

  it('returns false when current set is tiebreak', () => {
    const state = createBaseState({ sets: [setScore(6, 6, true, { player1: 3, player2: 3 })] });
    expect(isBreakPoint(state)).toBe(false);
  });

  it('returns true when receiver has advantage at deuce', () => {
    const state = createBaseState({
      sets: [setScore(4, 4)],
      currentGame: game(3, 3, { isDeuce: true, advantage: 'player2' }),
    });
    expect(isBreakPoint(state)).toBe(true);
  });

  it('returns false when server has advantage at deuce', () => {
    const state = createBaseState({
      sets: [setScore(4, 4)],
      currentGame: game(3, 3, { isDeuce: true, advantage: 'player1' }),
    });
    expect(isBreakPoint(state)).toBe(false);
  });

  it('returns true when receiverPoints >= 3 and serverPoints <= 2 (no deuce)', () => {
    const state = createBaseState({ sets: [setScore(4, 4)], currentGame: game(1, 3) });
    expect(isBreakPoint(state)).toBe(true);
  });

  it('returns false when receiverPoints < 3', () => {
    const state = createBaseState({ sets: [setScore(4, 4)], currentGame: game(2, 2) });
    expect(isBreakPoint(state)).toBe(false);
  });

  it('returns false when serverPoints > 2', () => {
    const state = createBaseState({ sets: [setScore(4, 4)], currentGame: game(3, 3) });
    expect(isBreakPoint(state)).toBe(false);
  });

  it('correctly identifies break point for player2 as server', () => {
    const state = createBaseState({ sets: [setScore(5, 4)], currentGame: game(3, 1), server: 'player2' });
    expect(isBreakPoint(state)).toBe(true);
  });

  it('returns false when server is player2 and serverPoints > 2', () => {
    const state = createBaseState({ sets: [setScore(4, 5)], currentGame: game(1, 3), server: 'player2' });
    expect(isBreakPoint(state)).toBe(false);
  });
});
