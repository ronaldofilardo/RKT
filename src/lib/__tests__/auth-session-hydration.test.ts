/**
 * @jest-environment jsdom
 */

const mockRedirectToLogin = jest.fn();

jest.mock('../auth-client-storage', () => {
  const original = jest.requireActual('../auth-client-storage');
  return {
    ...original,
    redirectToLogin: (...args: unknown[]) => mockRedirectToLogin(...args),
  };
});

import { hydrateSessionFromMe, ensureSessionHydrated } from '../auth-session-hydration.logic';

describe('auth-session-hydration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    sessionStorage.clear();
    mockRedirectToLogin.mockClear();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('retorna cached imediatamente se sessionStorage já possui dados', async () => {
    sessionStorage.setItem('user_id', 'u-123');
    sessionStorage.setItem('user_role', 'ANNOTATOR');
    global.fetch = jest.fn();

    const result = await hydrateSessionFromMe();

    expect(result.ok).toBe(true);
    expect(result.reason).toBe('cached');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('consulta /api/auth/me e hidrata sessionStorage quando vazio', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { id: 'u-456', role: 'TREINADOR_CLUBE', name: 'Treinador Carlos' },
        activeArea: 'TREINADOR_CLUBE',
      }),
    });

    const result = await hydrateSessionFromMe();

    expect(result.ok).toBe(true);
    expect(sessionStorage.getItem('user_id')).toBe('u-456');
    expect(sessionStorage.getItem('user_role')).toBe('TREINADOR_CLUBE');
    expect(sessionStorage.getItem('user_name')).toBe('Treinador Carlos');
    expect(sessionStorage.getItem('active_area')).toBe('TREINADOR_CLUBE');
  });

  it('detecta sessão inválida (401) e aciona redirectToLogin em ensureSessionHydrated', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'UNAUTHORIZED' }),
    });

    const isOk = await ensureSessionHydrated();

    expect(isOk).toBe(false);
    expect(mockRedirectToLogin).toHaveBeenCalled();
  });

  it('não aciona redirectToLogin em caso de falha de rede/servidor', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

    const isOk = await ensureSessionHydrated();

    expect(isOk).toBe(false);
    expect(mockRedirectToLogin).not.toHaveBeenCalled();
  });
});
