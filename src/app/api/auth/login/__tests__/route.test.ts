import { NextRequest, NextResponse } from 'next/server';

const mockFindPlayerByEmail = jest.fn();
const mockBcryptCompare = jest.fn();

jest.doMock('@/services/playerService', () => ({
  findPlayerByEmail: mockFindPlayerByEmail,
}));

jest.doMock('bcryptjs', () => ({
  compare: mockBcryptCompare,
  default: { compare: mockBcryptCompare },
}));

let POST: (req: NextRequest) => Promise<NextResponse>;

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  mockFindPlayerByEmail.mockReset();
  mockBcryptCompare.mockReset();
  mockBcryptCompare.mockResolvedValue(false);

  jest.doMock('@/services/playerService', () => ({
    findPlayerByEmail: mockFindPlayerByEmail,
  }));

  jest.doMock('bcryptjs', () => ({
    compare: mockBcryptCompare,
    default: { compare: mockBcryptCompare },
  }));

  const mod = await import('@/app/api/auth/login/route');
  POST = mod.POST;
});

describe('POST /api/auth/login', () => {
  it('deve retornar 400 para payload inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalido', password: '123' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.data.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 401 quando jogador não existe', async () => {
    mockFindPlayerByEmail.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('deve retornar 401 quando senha está incorreta', async () => {
    const player = {
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'ATHLETE' as const,
      passwordHash: 'hash',
    };

    mockFindPlayerByEmail.mockResolvedValueOnce(player);
    mockBcryptCompare.mockResolvedValue(false as never);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('deve retornar 200 e tokens para credenciais válidas', async () => {
    const player = {
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'ADMIN' as const,
      passwordHash: 'hash',
    };

    mockFindPlayerByEmail.mockResolvedValueOnce(player);
    mockBcryptCompare.mockResolvedValue(true as never);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.accessToken).toBeTruthy();
    expect(data.refreshToken).toBeTruthy();
    expect(data.user).toMatchObject({
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'ADMIN',
    });
  });

  it('deve retornar 500 quando ocorre erro interno', async () => {
    mockFindPlayerByEmail.mockRejectedValueOnce(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.data.error).toBe('INTERNAL_ERROR');
  });

  it('deve manter a role real do Player no JWT e no payload', async () => {
    const player = {
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'COACH' as const,
      passwordHash: 'hash',
    };

    mockFindPlayerByEmail.mockResolvedValueOnce(player);
    mockBcryptCompare.mockResolvedValue(true as never);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.role).toBe('COACH');
    expect(data.user.id).toBe('player-1');
    expect(data.user.email).toBe('user@example.com');
  });
});
