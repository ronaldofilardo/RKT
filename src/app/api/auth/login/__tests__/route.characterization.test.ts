import { NextRequest, NextResponse } from 'next/server';

const mockAuthenticateUser = jest.fn();

jest.doMock('../authenticate', () => ({
  authenticateUser: mockAuthenticateUser,
}));

let POST: (req: NextRequest) => Promise<NextResponse>;

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  mockAuthenticateUser.mockReset();

  jest.doMock('../authenticate', () => ({
    authenticateUser: mockAuthenticateUser,
  }));

  const mod = await import('@/app/api/auth/login/route');
  POST = mod.POST;
});

describe('CONTRACT: POST /api/auth/login — Snapshot do contrato atual (Fase 1 caracterização)', () => {
  it('retorna accessToken e user no body 200', async () => {
    const user = {
      id: 'user-1',
      name: 'Anotador Teste',
      email: 'anotador@rkt.com',
      cpf: '11111111111',
      role: 'ANNOTATOR' as const,
      isActive: true,
    };

    mockAuthenticateUser.mockResolvedValueOnce(user);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'anotador@rkt.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.accessToken).toBeTruthy();
    expect(typeof data.accessToken).toBe('string');
    expect(data.user).toMatchObject({
      id: 'user-1',
      name: 'Anotador Teste',
      email: 'anotador@rkt.com',
      cpf: '11111111111',
      role: 'ANNOTATOR',
    });
  });

  it('define cookies rkt_access_token (httpOnly) e access_token (não httpOnly) com maxAge 2h', async () => {
    const user = {
      id: 'user-1',
      name: 'Anotador Teste',
      email: 'anotador@rkt.com',
      cpf: '11111111111',
      role: 'ANNOTATOR' as const,
      isActive: true,
    };

    mockAuthenticateUser.mockResolvedValueOnce(user);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'anotador@rkt.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const setCookie = res.headers.get('set-cookie');

    expect(setCookie).toContain('rkt_access_token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('access_token=');
    expect(setCookie).toContain('Max-Age=7200');
    expect(setCookie).toContain('Path=/');
    expect(setCookie).toContain('SameSite=lax');
  });

  it('retorna 401 quando credenciais inválidas', async () => {
    mockAuthenticateUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'anotador@rkt.com', password: 'wrong' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('retorna 400 para payload sem identifier/email', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: '', password: '123' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.data.error).toBe('VALIDATION_ERROR');
  });

  it('retorna 500 em erro interno', async () => {
    mockAuthenticateUser.mockRejectedValueOnce(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'anotador@rkt.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.data.error).toBe('INTERNAL_ERROR');
  });
});