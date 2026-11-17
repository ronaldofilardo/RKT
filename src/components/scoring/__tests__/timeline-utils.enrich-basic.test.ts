/**
 * Split de timeline-utils.test.ts — describe "enrichPointsFromHistory":
 * enriquecimento básico (winner, setNumber). Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../timeline.logic';
import { hist, player1Id, player2Id } from './timelineUtilsTestKit';

describe('enrichPointsFromHistory — enriquecimento básico', () => {
  it('deve enriquecer pontos com informações de estado', () => {
    const history = hist(
      { winnerId: player1Id, type: 'WINNER' },
      { sets: [{ player1: 1, player2: 0, isTiebreak: false, tiebreakScore: null }], currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false } }
    );

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points).toHaveLength(1);
    expect(points[0].winner).toBe('PLAYER_1');
    expect(points[0].pointNumber).toBe(1);
  });

  it('deve identificar corretamente PLAYER_2 como winner', () => {
    const history = hist({ winnerId: player2Id, type: 'WINNER' });

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].winner).toBe('PLAYER_2');
  });

  it('deve calcular setNumber corretamente', () => {
    const history = hist({ winnerId: player1Id }, { sets: [] });

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].setNumber).toBe(1);
  });
});
