/**
 * @jest-environment jsdom
 */
import { performLogout } from '../auth-client-logout';

describe('performLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem('user_id', 'u1');
    sessionStorage.setItem('user_role', 'SUPORTE');
    sessionStorage.setItem('user_name', 'Suporte User');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    }) as unknown as typeof fetch;
  });

  it('faz requisição POST para /api/auth/logout e limpa o estado de auth', async () => {
    await performLogout();

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
    expect(sessionStorage.getItem('user_id')).toBeNull();
    expect(sessionStorage.getItem('user_role')).toBeNull();
    expect(sessionStorage.getItem('user_name')).toBeNull();
  });

  it('continua a limpeza local mesmo se a chamada de rede falhar', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch;

    await expect(performLogout()).resolves.toBeUndefined();
    expect(sessionStorage.getItem('user_id')).toBeNull();
    expect(sessionStorage.getItem('user_role')).toBeNull();
    expect(sessionStorage.getItem('user_name')).toBeNull();
  });
});
