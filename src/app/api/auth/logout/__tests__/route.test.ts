import { POST } from '../route';

describe('POST /api/auth/logout', () => {
  it('retorna 200 com sucesso e limpa cookies', async () => {
    const response = await POST();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    // Valida que os cookies foram limpos (maxAge: 0 / valor vazio)
    const setCookieHeaders = response.headers.get('set-cookie');
    expect(setCookieHeaders).toBeDefined();
    expect(setCookieHeaders).toContain('rkt_access_token=;');
    expect(setCookieHeaders).toContain('access_token=;');
    expect(setCookieHeaders).toContain('user_role=;');
    expect(setCookieHeaders).toContain('Max-Age=0');
  });
});
