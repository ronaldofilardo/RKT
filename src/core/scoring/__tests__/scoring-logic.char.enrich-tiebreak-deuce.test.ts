/**
 * Split de scoring-logic.characterization.test.ts — describe "enrichPointsFromHistory"
 * (tiebreak e deuce): isTiebreak pelo set atual de stateBefore e
 * gameIsDeuce/gameAdvantage pelo currentGame. Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../scoring-logic';
import { createBaseState, createHistoryEntry, game, setScore } from './scoringLogicTestKit';

describe('enrichPointsFromHistory — tiebreak e deuce', () => {
  it('sets isTiebreak true when current set is tiebreak', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ sets: [setScore(6, 6, true, { player1: 3, player2: 3 })] }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].isTiebreak).toBe(true);
  });

  it('sets isTiebreak false when current set is not tiebreak', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ sets: [setScore(4, 3)] }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].isTiebreak).toBe(false);
  });

  it('sets isTiebreak false when no sets exist', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ sets: [] }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].isTiebreak).toBe(false);
  });

  it('sets gameIsDeuce from currentGame.isDeuce', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ currentGame: game(3, 3, { isDeuce: true, advantage: 'player1' }) }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].gameIsDeuce).toBe(true);
    expect(result[0].gameAdvantage).toBe('player1');
  });

  it('sets gameIsDeuce false and gameAdvantage null when not deuce', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ currentGame: game(2, 1) }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].gameIsDeuce).toBe(false);
    expect(result[0].gameAdvantage).toBeNull();
  });
});
