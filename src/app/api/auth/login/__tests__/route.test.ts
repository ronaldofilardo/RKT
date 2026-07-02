const mockFindUnique = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findUnique: mockFindUnique,
    },
  },
}));

jest.mock('bcryptjs', () => {
  const _mockCompare = jest.fn();
  return { compare: _mockCompare, default: { compare: _mockCompare }, _mockCompare };
});

import { NextRequest, NextResponse } from 'next/server';
import { _mockCompare as mockBcryptCompare } from 'bcryptjs';

let POST: (req: NextRequest) => Promise<NextResponse>;

beforeEach(async () => {
  jest.clearAllMocks();
  mockFindUnique.mockReset();
  mockBcryptCompare.mockReset();
  (mockBcryptCompare as jest.Mock).mockResolvedValue(false);

  const mod = await import('@/app/api/auth/login/route');
  POST = mod.POST;
});

describe('POST /api/auth/login', () => {
  it('deve retornar 400 para payload inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalido', password: '123' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('INVALID_INPUT')
  })

  it('deve retornar 401 quando jogador não existe', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('INVALID_CREDENTIALS')
  })

  it('deve retornar 401 quando senha está incorreta', async () => {
    const player = {
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'ATHLETE' as const,
      passwordHash: 'hash',
    }

    mockFindUnique.mockResolvedValueOnce(player)
    mockBcryptCompare.mockResolvedValue(false as never)

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('INVALID_CREDENTIALS')
  })

  it('deve retornar 200 e tokens para credenciais válidas', async () => {
    const player = {
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'ADMIN' as const,
      passwordHash: 'hash',
    }

    mockFindUnique.mockResolvedValueOnce(player)
    mockBcryptCompare.mockResolvedValue(true as never)

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.accessToken).toBeTruthy()
    expect(data.refreshToken).toBeTruthy()
    expect(data.user).toMatchObject({
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'ADMIN',
    })
  })

  it('deve retornar 500 quando ocorre erro interno', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB Error'))

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('INTERNAL_ERROR')
  })

  it('deve reautenticar com sucesso e gerar novos tokens', async () => {
    const player = {
      id: 'player-1',
      name: 'Player',
      email: 'user@example.com',
      role: 'COACH' as const,
      passwordHash: 'hash',
    }

    mockFindUnique.mockResolvedValueOnce(player)
    mockBcryptCompare.mockResolvedValue(true as never)

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const data = await res.json()

    mockFindUnique.mockResolvedValueOnce(player)
    mockBcryptCompare.mockResolvedValue(true as never)

    const req2 = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: '12345678' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res2 = await POST(req2)
    const data2 = await res2.json()

    expect(res2.status).toBe(200)
    expect(data2.accessToken).toBeTruthy()
    expect(data2.user.role).toBe('COACH')
  })
})