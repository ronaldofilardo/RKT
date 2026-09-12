import { persistStateWithRetry } from '../useScoringHandlers.persistence';

describe('useScoringHandlers.persistence - Regressoes Reais', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('deve retornar success=false imediatamente se match for nulo', async () => {
    const result = await persistStateWithRetry(
      { sets: [], isFinished: false } as any,
      'test-label',
      {
        matchId: 'm1',
        match: null,
        tokenRef: { current: null },
        setError: jest.fn(),
      }
    );

    expect(result.success).toBe(false);
  });

  it('deve enviar PATCH com state FINISHED quando isFinished for true', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: 3 }),
    });
    global.fetch = fetchMock;

    const result = await persistStateWithRetry(
      { sets: [], isFinished: true } as any,
      'test-finish',
      {
        matchId: 'm1',
        match: { version: 2 },
        tokenRef: { current: 'token-abc' },
        setError: jest.fn(),
      }
    );

    expect(result.success).toBe(true);
    expect(result.version).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/matches/m1/state',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"state":"FINISHED"'),
      })
    );
  });
});
