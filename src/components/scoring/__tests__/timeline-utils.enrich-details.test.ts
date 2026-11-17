/**
 * Split de timeline-utils.test.ts — describe "enrichPointsFromHistory":
 * isTiebreak, rallyLength de ACE/DOUBLE_FAULT e propagação de firstFaultDetail.
 * Asserções 1:1.
 */
import { enrichPointsFromHistory } from '../timeline.logic';
import { hist, player1Id, player2Id } from './timelineUtilsTestKit';

describe('enrichPointsFromHistory — tiebreak, rallyLength e firstFault', () => {
  it('deve marcar isTiebreak corretamente', () => {
    const history = hist(
      { winnerId: player1Id },
      {
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 1, player2: 0 } }],
        currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      }
    );

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].isTiebreak).toBe(true);
  });

  it('deve definir rallyLength para 1 em ACE ou DOUBLE_FAULT', () => {
    const aceHistory = hist({ winnerId: player1Id, type: 'ACE', rallyLength: undefined });
    const dfHistory = hist({ winnerId: player2Id, type: 'DOUBLE_FAULT', rallyLength: undefined });

    const acePoints = enrichPointsFromHistory(aceHistory, player1Id, player2Id);
    const dfPoints = enrichPointsFromHistory(dfHistory, player1Id, player2Id);

    expect(acePoints[0].rallyLength).toBe(1);
    expect(dfPoints[0].rallyLength).toBe(1);
  });

  it('deve propagar firstFaultDetail em DOUBLE_FAULT', () => {
    const history = hist({
      winnerId: player2Id,
      type: 'DOUBLE_FAULT',
      firstFaultDetail: { errorType: 'REDE', serveEffect: 'FATIO', direction: 'CRUZADO' },
    });

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].firstFault).toEqual({
      errorType: 'REDE',
      serveEffect: 'FATIO',
      direction: 'CRUZADO',
    });
  });

  it('deve retornar undefined em DOUBLE_FAULT sem firstFaultDetail', () => {
    const history = hist({ winnerId: player2Id, type: 'DOUBLE_FAULT', firstFaultDetail: undefined });

    const points = enrichPointsFromHistory(history, player1Id, player2Id);

    expect(points[0].firstFault).toBeUndefined();
  });
});
