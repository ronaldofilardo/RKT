/**
 * Split de scoring-logic.characterization.test.ts — describe "enrichPointsFromHistory"
 * (setNumber, gamesScore, gameScore e múltiplos pontos): numeração de set,
 * placares derivados de stateBefore e processamento de histórico com N pontos.
 * Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../scoring-logic';
import { createBaseState, createHistoryEntry, createPointLog, game, setScore } from './scoringLogicTestKit';

describe('enrichPointsFromHistory — setNumber, placares e histórico', () => {
  it('calculates correct setNumber from stateBefore.sets.length', () => {
    const history = [
      createHistoryEntry({
        stateBefore: createBaseState({ sets: [setScore(0, 0)] }),
      }),
      createHistoryEntry({
        stateBefore: createBaseState({ sets: [setScore(6, 4), setScore(0, 0)] }),
      }),
    ];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].setNumber).toBe(1);
    expect(result[1].setNumber).toBe(2);
  });

  it('sets setNumber to 1 when stateBefore.sets is empty', () => {
    const history = [createHistoryEntry({ stateBefore: createBaseState({ sets: [] }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].setNumber).toBe(1);
  });

  it('sets gamesScore from currentSet games', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ sets: [setScore(4, 3)] }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].gamesScore).toEqual({ player1: 4, player2: 3 });
  });

  it('sets gamesScore to 0-0 when no sets', () => {
    const history = [createHistoryEntry({ stateBefore: createBaseState({ sets: [] }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].gamesScore).toEqual({ player1: 0, player2: 0 });
  });

  it('sets gameScore from currentGame points', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ currentGame: game(2, 1) }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].gameScore).toEqual({ player1: 2, player2: 1 });
  });

  it('handles multiple points in history', () => {
    const history = [
      createHistoryEntry({ point: createPointLog({ pointNumber: 1, winnerId: 'p1' }) }),
      createHistoryEntry({ point: createPointLog({ pointNumber: 2, winnerId: 'p2' }) }),
      createHistoryEntry({ point: createPointLog({ pointNumber: 3, winnerId: 'p1' }) }),
    ];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result).toHaveLength(3);
    expect(result[0].pointNumber).toBe(1);
    expect(result[1].pointNumber).toBe(2);
    expect(result[2].pointNumber).toBe(3);
    expect(result[0].winner).toBe('PLAYER_1');
    expect(result[1].winner).toBe('PLAYER_2');
    expect(result[2].winner).toBe('PLAYER_1');
  });
});
