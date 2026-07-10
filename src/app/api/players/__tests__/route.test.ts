jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/services/playerService', () => ({
  listPlayers: jest.fn(),
  createPlayer: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { listPlayers, createPlayer } from '@/services/playerService';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockListPlayers = listPlayers as jest.MockedFunction<typeof listPlayers>;
const mockCreatePlayer = createPlayer as jest.MockedFunction<typeof createPlayer>;

describe('GET /api/players', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(null);
  });

  it('deve retornar 403 se usuário não tem role SPECTATOR', async () => {
    mockRequireRole.mockResolvedValue(
      NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost:3000/api/players');
    const mod = await import('@/app/api/players/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('deve retornar lista de jogadores ordenados por nome', async () => {
    const mockPlayers = [
      { id: 'p1', name: 'Ana' },
      { id: 'p2', name: 'Bruno' },
      { id: 'p3', name: 'Carlos' },
    ];

    mockListPlayers.mockResolvedValue(mockPlayers as any);

    const req = new NextRequest('http://localhost:3000/api/players');
    const mod = await import('@/app/api/players/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.players).toHaveLength(3);
    expect(data.nextCursor).toBeNull();
  });
});

describe('POST /api/players', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(null);
  });

  it('deve retornar 400 se nome tem menos de 2 chars', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 400 se nome está ausente', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 se gender é inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', gender: 'INVALID' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('MALE or FEMALE');
  });

  it('deve retornar 400 se age é inválido (menor que 1)', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', age: 0 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('Age must be between 1 and 120');
  });

  it('deve retornar 400 se age é maior que 120', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', age: 121 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 400 se dominance é inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', dominance: 'INVALID' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('LEFT or RIGHT');
  });

  it('deve retornar 400 se backhand é inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', backhand: 'INVALID' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('ONE_HANDED or TWO_HANDED');
  });

  it('deve retornar 400 se ranking é inválido (menor que 1)', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', ranking: 0 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('positive number');
  });

  it('deve retornar 400 se ranking não é número', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', ranking: 'abc' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 400 se rankings não é um objeto', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', rankings: ['ESTADUAL'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('Rankings must be an object');
  });

  it('deve retornar 400 se rankings tem tipo inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', rankings: { INVALID: 1 } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('Invalid ranking type');
  });

  it('deve retornar 400 se ranking position não é número positivo', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', rankings: { ESTADUAL: 0 } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(data.message).toContain('must be a positive number');
  });

  it('deve criar jogador com rankings', async () => {
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Novo Jogador',
      gender: 'MALE',
      age: 25,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      ranking: 10,
      rankings: { ESTADUAL: 5, BRASILEIRO: 20 },
    });

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo Jogador',
        gender: 'MALE',
        age: 25,
        dominance: 'RIGHT',
        backhand: 'ONE_HANDED',
        ranking: 10,
        rankings: { ESTADUAL: 5, BRASILEIRO: 20 },
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('Novo Jogador');
    expect(data.rankings).toEqual({ ESTADUAL: 5, BRASILEIRO: 20 });
  });

  it('deve retornar 403 se usuário não tem role ATHLETE', async () => {
    mockRequireRole.mockResolvedValue(
      NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Teste' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('deve retornar 500 se ocorrer erro interno', async () => {
    mockCreatePlayer.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Jogador' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('deve retornar 500 se ocorrer erro interno no GET', async () => {
    mockListPlayers.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/players');
    const mod = await import('@/app/api/players/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});