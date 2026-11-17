/**
 * Split de scoring-logic.characterization.test.ts — describe "enrichPointsFromHistory"
 * (básico): histórico vazio e enriquecimento completo de um ponto simples.
 * Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../scoring-logic';
import { createHistoryEntry, createPointLog } from './scoringLogicTestKit';

describe('enrichPointsFromHistory — básico', () => {
  it('returns empty array for empty history', () => {
    const result = enrichPointsFromHistory([], 'p1', 'p2');
    expect(result).toEqual([]);
  });

  it('enriches single point with basic info', () => {
    const history = [createHistoryEntry({ point: createPointLog({ winnerId: 'p1', type: 'RALLY' }) })];
    const result = enrichPointsFromHistory(history, 'p1', 'p2');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      pointNumber: 1,
      winner: 'PLAYER_1',
      type: 'RALLY',
      server: 'player1',
      isFirstServe: true,
      isSecondServe: false,
      rallyLength: 4,
      setNumber: 1,
      isBreakPoint: false,
      isGameBall: false,
      isSetBall: false,
      rallyDetails: { situacao: 'rally', tipo: 'forehand', subtipo1: 'crosscourt' },
      note: undefined,
      isTiebreak: false,
      gameIsDeuce: false,
      gameAdvantage: null,
      firstFault: undefined,
    });
  });
});
