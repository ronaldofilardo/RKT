/**
 * @jest-environment jsdom
 */

import { createPointSyncService } from '@/hooks/useScoringHandlers.point-sync';
import type { PointFlow } from '@/core/scoring/types';

describe('createPointSyncService — 401 handling (Fase 1 caracterização)', () => {
  const mockConfig = {
    matchId: 'match-1',
    match: {
      id: 'match-1',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'Player 1' },
      player2: { id: 'p2', name: 'Player 2' },
      initialServerId: 'p1',
      state: 'IN_PROGRESS' as const,
      version: 1,
    },
    tokenRef: { current: 'valid-token' },
    pointSequenceRef: { current: 0 },
    setError: jest.fn(),
  };

  const mockFlow: PointFlow = {
    winnerId: 'p1',
    type: 'WINNER',
    serverId: 'p1',
    timestamp: Date.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig.setError.mockClear();
    mockConfig.pointSequenceRef.current = 0;
    mockConfig.tokenRef.current = 'valid-token';
  });

  afterEach(() => {
    delete (global as any).fetch;
  });

  it('deve retornar needsLogin=true ao receber 401', async () => {
    const service = createPointSyncService(mockConfig as any);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'UNAUTHORIZED' }),
      });

    const result = await service.syncPointToServer(mockFlow, 1, 'client-event-1');

    expect(result.success).toBe(false);
    expect(result.needsLogin).toBe(true);
    expect(result.needsResync).toBe(false);
    expect(mockConfig.setError).toHaveBeenCalledWith(
      'Sessão expirada — o ponto foi salvo localmente. Faça login novamente para sincronizar.'
    );
  });

  it('não deve tentar retry automático ao receber 401 (diferente de 409)', async () => {
    const service = createPointSyncService(mockConfig as any);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'UNAUTHORIZED' }),
      });

    const result = await service.syncPointToServer(mockFlow, 1, 'client-event-1');

    // fetch chamado apenas uma vez (não há retry)
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.needsLogin).toBe(true);
  });

  it('deve ainda fazer retry para 409 SEQUENCE_CONFLICT', async () => {
    const service = createPointSyncService(mockConfig as any);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue({ error: 'SEQUENCE_CONFLICT', expectedSequence: 5 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ scoreState: {}, version: 2, pointLogId: 'log-1' }),
      });

    const result = await service.syncPointToServer(mockFlow, 1, 'client-event-1');

    expect(result.needsResync).toBe(true);
    expect(result.needsLogin).toBeFalsy();
    expect(mockConfig.pointSequenceRef.current).toBe(4); // expectedSequence - 1
  });

  it('deve ainda tratar outros erros como needsResync', async () => {
    const service = createPointSyncService(mockConfig as any);

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'INTERNAL_ERROR', message: 'Server error' }),
      });

    const result = await service.syncPointToServer(mockFlow, 1, 'client-event-1');

    expect(result.success).toBe(false);
    expect(result.needsResync).toBe(true);
    expect(result.needsLogin).toBeFalsy();
  });

  it('deve enfileirar ponto para offline corretamente', async () => {
    const service = createPointSyncService(mockConfig as any);

    const mockEnqueue = jest.fn().mockResolvedValue({ id: 'action-1' } as any);

    const queued = await service.queuePointForOffline(mockEnqueue, mockFlow);

    expect(mockEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        type: 'POINT',
        payload: mockFlow,
      })
    );
    expect(queued.id).toBe('action-1');
  });
});