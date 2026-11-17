/**
 * Split de timeline-utils.test.ts — describe "enrichPointsFromHistory":
 * detecção de break point (receptor a 1 ponto, deuce com vantagem,
 * servidor vencendo e tiebreak). Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../timeline.logic';
import { hist, player1Id, player2Id } from './timelineUtilsTestKit';

describe('enrichPointsFromHistory — detecção de break point', () => {
  it('deve detectar break point quando receptor tem 3 pontos e servidor <= 2 no game atual', () => {
    // server = player1 (saca), receiver = player2. Para ser break point,
    // player2 precisa estar a 1 ponto do game: receiverPoints (player2) >= 3
    // e serverPoints (player1) <= 2. O placar de GAMES é indiferente.
    const history = hist(
      { winnerId: player2Id },
      {
        sets: [{ player1: 4, player2: 5, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 2, player2: 3, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
      }
    );

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].isBreakPoint).toBe(true);
  });

  it('deve detectar break point em deuce com advantage do receptor', () => {
    const history = hist(
      { winnerId: player2Id },
      {
        sets: [{ player1: 4, player2: 5, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: 'player2', secondServe: false },
        server: 'player1',
      }
    );

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].isBreakPoint).toBe(true);
  });

  it('não deve marcar break point se servidor está vencendo o game (receptor < 3)', () => {
    const history = hist(
      { winnerId: player2Id },
      {
        sets: [{ player1: 5, player2: 3, isTiebreak: false, tiebreakScore: null }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
      }
    );

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].isBreakPoint).toBe(false);
  });

  it('não deve marcar break point em tiebreak (conceito não se aplica)', () => {
    const history = hist(
      { winnerId: player2Id },
      {
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 6 } }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
        server: 'player1',
      }
    );

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].isBreakPoint).toBe(false);
  });
});
