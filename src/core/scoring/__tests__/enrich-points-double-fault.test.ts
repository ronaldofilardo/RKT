import { enrichPointsFromHistory } from '../scoring-logic';
import type { HistoryEntry } from '../types';

describe('enrichPointsFromHistory - Double Fault Details', () => {
  it('deve preservar os detalhes do primeiro saque (firstServeOutcome) quando ocorre dupla falta', () => {
    const history: HistoryEntry[] = [
      {
        point: {
          id: 'pt-1',
          winnerId: 'p2',
          type: 'DOUBLE_FAULT',
          serverId: 'p1',
          firstFaultDetail: {
            step: 'first',
            errorType: 'net',
          },
          rallyDetails: {
            serveErrorDetails: {
              step: 'second',
              errorType: 'out',
              shotType: 'topspin',
              position: 'aberto',
            },
          },
        } as any,
        stateBefore: {
          sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
        } as any,
      },
      {
        point: {
          id: 'pt-2',
          winnerId: 'p1',
          type: 'DOUBLE_FAULT',
          serverId: 'p2',
          firstFaultDetail: {
            step: 'first',
            errorType: 'out',
          },
          rallyDetails: {
            serveErrorDetails: {
              step: 'second',
              errorType: 'net',
            },
          },
        } as any,
        stateBefore: {
          sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
          currentGame: { player1: 0, player2: 1, isDeuce: false, advantage: null, secondServe: false },
          server: 'player2',
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
        } as any,
      },
    ];

    const result = enrichPointsFromHistory(history, 'p1', 'p2');

    expect(result).toHaveLength(2);

    // Primeiro ponto: Dupla falta do player1
    expect(result[0].type).toBe('DOUBLE_FAULT');
    expect(result[0].firstServeOutcome).toBe('net');
    expect(result[0].rallyDetails?.serveErrorDetails?.step).toBe('second');
    expect(result[0].rallyDetails?.serveErrorDetails?.errorType).toBe('out');
    expect(result[0].rallyDetails?.serveErrorDetails?.shotType).toBe('topspin');
    expect(result[0].rallyDetails?.serveErrorDetails?.position).toBe('aberto');

    // Segundo ponto: Dupla falta do player2
    expect(result[1].type).toBe('DOUBLE_FAULT');
    expect(result[1].firstServeOutcome).toBe('out');
    expect(result[1].rallyDetails?.serveErrorDetails?.step).toBe('second');
    expect(result[1].rallyDetails?.serveErrorDetails?.errorType).toBe('net');
  });
});
