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

describe('POST /api/auth/login', () => {
  it('deve retornar 400 para payload inválido (sem identifier ou email)', async () => {
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

  it('deve retornar 401 quando usuário não existe ou credenciais inválidas', async () => {
    mockAuthenticateUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('deve autenticar com sucesso usando e-mail', async () => {
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
    expect(data.user).toMatchObject({
      id: 'user-1',
      name: 'Anotador Teste',
      email: 'anotador@rkt.com',
      cpf: '11111111111',
      role: 'ANNOTATOR',
    });
  });

  it('deve autenticar com sucesso usando CPF', async () => {
    const adminUser = {
      id: 'admin-1',
      name: 'Admin Teste',
      email: 'admin@rkt.com',
      cpf: '00000000000',
      role: 'ADMIN' as const,
      isActive: true,
    };

    mockAuthenticateUser.mockResolvedValueOnce(adminUser);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: '000.000.000-00', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.accessToken).toBeTruthy();
    expect(data.user).toMatchObject({
      id: 'admin-1',
      name: 'Admin Teste',
      email: 'admin@rkt.com',
      cpf: '00000000000',
      role: 'ADMIN',
    });
  });

  it('deve retornar 500 quando ocorre erro interno', async () => {
    mockAuthenticateUser.mockRejectedValueOnce(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.data.error).toBe('INTERNAL_ERROR');
  });
});
