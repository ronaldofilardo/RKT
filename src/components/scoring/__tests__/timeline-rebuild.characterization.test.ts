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
});
