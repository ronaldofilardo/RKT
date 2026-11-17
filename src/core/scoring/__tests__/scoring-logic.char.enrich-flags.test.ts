/**
 * Split de scoring-logic.characterization.test.ts — describe "enrichPointsFromHistory"
 * (flags): vencedor, isBreakPoint, isGameBall (jogo/tiebreak), isSetBall e
 * type de ACE/DOUBLE_FAULT. Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../scoring-logic';
import { createBaseState, createHistoryEntry, createPointLog, game, setScore } from './scoringLogicTestKit';

describe('enrichPointsFromHistory — flags', () => {
  it('identifies PLAYER_2 as winner when winnerId matches player2Id', () => {
    const history = [createHistoryEntry({ point: createPointLog({ winnerId: 'p2' }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].winner).toBe('PLAYER_2');
  });

  it('sets isBreakPoint true when receiver has break point', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({
        sets: [setScore(4, 4)],
        currentGame: game(1, 3),
        server: 'player1',
      }),
      point: createPointLog({ winnerId: 'p1' }),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].isBreakPoint).toBe(true);
  });

  it('sets isGameBall true at 40-0', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ currentGame: game(3, 0) }),
      point: createPointLog(),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].isGameBall).toBe(true);
  });

  it('sets isGameBall true in tiebreak at 9-8', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ sets: [setScore(6, 6, true, { player1: 9, player2: 8 })] }),
      point: createPointLog(),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].isGameBall).toBe(true);
  });

  it('sets isSetBall true at 5-4', () => {
    const history = [createHistoryEntry({
      stateBefore: createBaseState({ sets: [setScore(5, 4)] }),
      point: createPointLog(),
    })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].isSetBall).toBe(true);
  });

  it('sets isServeFinish true for ACE', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'ACE' }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].type).toBe('ACE');
  });

  it('sets isServeFinish true for DOUBLE_FAULT', () => {
    const history = [createHistoryEntry({ point: createPointLog({ type: 'DOUBLE_FAULT' }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result[0].type).toBe('DOUBLE_FAULT');
  });
});
