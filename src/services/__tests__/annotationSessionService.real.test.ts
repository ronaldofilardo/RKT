import { createSessionService } from '../annotationSessionService';

describe('annotationSessionService - Regressoes Reais', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('deve injetar token nos headers e realizar requisicao para endpoint correto', async () => {
    const mockSessions = [{ id: 's1', matchId: 'm1', annotatorUserId: 'u1' }];
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSessions,
    });
    global.fetch = fetchMock;

    const service = createSessionService({
      baseUrl: 'http://localhost:3000/api',
      getToken: async () => 'mock-jwt-token',
    });

    const result = await service.listSessions('m1');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/matches/m1/sessions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-jwt-token',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual(mockSessions);
  });

  it('deve lancar erro quando a resposta HTTP nao for bem-sucedida', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'SERVER_ERROR' }),
    });

    const service = createSessionService({
      baseUrl: 'http://localhost:3000/api',
      getToken: async () => null,
    });

    await expect(service.listSessions('m1')).rejects.toThrow('Failed to list sessions');
  });
});
