import { createPointSyncService } from '../useScoringHandlers.point-sync';

describe('useScoringHandlers.point-sync - Regressoes Reais', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('deve retornar needsResync=true se match for nulo', async () => {
    const service = createPointSyncService({
      matchId: 'm1',
      match: null,
      tokenRef: { current: 'token' },
      pointSequenceRef: { current: 0 },
      setError: jest.fn(),
    });

    const flow = {
      winnerId: 'p1',
      type: 'ACE' as const,
      serverId: 'p1',
    };

    const result = await service.syncPointToServer(flow as any, 1);
    expect(result.success).toBe(false);
    expect(result.needsResync).toBe(true);
  });

  it('deve sincronizar ponto com sucesso quando API responde 200', async () => {
    const mockResponse = { scoreState: { sets: [] }, version: 2, pointLogId: 'log-1' };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const service = createPointSyncService({
      matchId: 'm1',
      match: { id: 'm1' } as any,
      tokenRef: { current: 'auth-token' },
      pointSequenceRef: { current: 1 },
      setError: jest.fn(),
    });

    const flow = {
      winnerId: 'p1',
      type: 'WINNER' as const,
      serverId: 'p1',
    };

    const result = await service.syncPointToServer(flow as any, 1, 'client-evt-1');
    expect(result.success).toBe(true);
    expect(result.serverResponse).toEqual(mockResponse);
  });
});
