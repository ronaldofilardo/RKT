import { rebuildTimelineFromPointLogs } from '../timeline-rebuild';

describe('timeline-rebuild - Caracterizacao', () => {
  it('deve retornar array vazio se pointLogs for vazio', () => {
    const result = rebuildTimelineFromPointLogs([], [], 'p1', 'p2', 'p1', 'BEST_OF_3');
    expect(result).toEqual([]);
  });

  it('deve processar logs de pontos e retornar timeline reconstruida', () => {
    const pointLogs = [
      {
        id: 'log-1',
        winnerId: 'p1',
        type: 'ACE',
        serverId: 'p1',
        timestamp: new Date(),
        sequenceNumber: 1,
        clientEventId: 'evt-1',
        annotations: { isFirstServe: true },
        audioNote: null,
        audioNoteMime: null,
        audioNoteDuration: null,
      },
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, 'p1', 'p2', 'p1', 'BEST_OF_3');
    expect(result.length).toBe(1);
    expect(result[0].winner).toBe('PLAYER_1');
    expect(result[0].type).toBe('ACE');
  });

  it('deve suportar scoreEdits com newScoreState em formato envelope {state, history}', () => {
    const pointLogs = [
      {
        id: 'log-1',
        winnerId: 'p1',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: new Date('2026-09-22T10:00:00Z'),
        sequenceNumber: 1,
        clientEventId: 'evt-1',
        annotations: null,
        audioNote: null,
        audioNoteMime: null,
        audioNoteDuration: null,
      },
      {
        id: 'log-2',
        winnerId: 'p1',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: new Date('2026-09-22T10:05:00Z'),
        sequenceNumber: 2,
        clientEventId: 'evt-2',
        annotations: null,
        audioNote: null,
        audioNoteMime: null,
        audioNoteDuration: null,
      },
    ];

    const scoreEdits = [
      {
        id: 'edit-1',
        editedAt: new Date('2026-09-22T10:02:00Z'),
        newScoreState: {
          state: {
            sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
            currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
            server: 'player1',
            isFinished: false,
            winner: null,
            setsWon: { player1: 1, player2: 0 },
          },
          history: [],
        },
      } as any,
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, 'p1', 'p2', 'p1', 'BEST_OF_3', scoreEdits);
    expect(result.length).toBe(2);
    expect(result[0].winner).toBe('PLAYER_1');
    expect(result[1].winner).toBe('PLAYER_1');
  });

  it('deve suportar scoreEdits com newScoreState serializado em JSON string', () => {
    const pointLogs = [
      {
        id: 'log-1',
        winnerId: 'p1',
        type: 'WINNER',
        serverId: 'p1',
        timestamp: new Date('2026-09-22T10:00:00Z'),
        sequenceNumber: 1,
        clientEventId: 'evt-1',
        annotations: null,
        audioNote: null,
        audioNoteMime: null,
        audioNoteDuration: null,
      },
    ];

    const scoreEdits = [
      {
        id: 'edit-1',
        editedAt: new Date('2026-09-22T09:50:00Z'),
        newScoreState: JSON.stringify({
          state: {
            sets: [{ player1: 1, player2: 0, isTiebreak: false }],
            currentGame: { player1: 0, player2: 0, isDeuce: false },
            server: 'p1',
          },
        }),
      } as any,
    ];

    const result = rebuildTimelineFromPointLogs([], pointLogs, 'p1', 'p2', 'p1', 'BEST_OF_3', scoreEdits);
    expect(result.length).toBe(1);
    expect(result[0].winner).toBe('PLAYER_1');
  });
});
