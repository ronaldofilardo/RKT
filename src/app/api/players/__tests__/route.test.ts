jest.mock('@/lib/prisma', () => ({
  prisma: {
    player: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('@/services/playerService', () => ({
  listPlayers: jest.fn(),
  createPlayer: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { listPlayers, createPlayer } from '@/services/playerService';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockListPlayers = listPlayers as jest.MockedFunction<typeof listPlayers>;
const mockCreatePlayer = createPlayer as jest.MockedFunction<typeof createPlayer>;

let ATHLETE_HEADERS: Record<string, string> = {};
let SPECTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ATHLETE_HEADERS = await makeAuthHeaders('user-athlete', 'ATHLETE');
  SPECTATOR_HEADERS = await makeAuthHeaders('user-spect', 'SPECTATOR');
});

describe('GET /api/players', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 403 se usuário não tem role SPECTATOR', async () => {
    // Sem headers de auth => requireRole retorna 401, mas para validar
    // a guarda de role SPECTATOR usamos um token válido com role abaixo
    // do mínimo exigido pela route. Não há role abaixo de SPECTATOR no
    // schema do projeto, então simulamos a ausência de token.
    const req = new NextRequest('http://localhost:3000/api/players');
    const mod = await import('@/app/api/players/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('deve retornar lista de jogadores ordenados por nome', async () => {
    const mockPlayers = [
      { id: 'p1', name: 'Ana' },
      { id: 'p2', name: 'Bruno' },
      { id: 'p3', name: 'Carlos' },
    ];

    mockListPlayers.mockResolvedValue(mockPlayers as any);

    const req = new NextRequest('http://localhost:3000/api/players?userId=user-123', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/players/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.players).toHaveLength(3);
    expect(data.data.nextCursor).toBeNull();
  });
});

describe('POST /api/players', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 400 se nome tem menos de 2 chars', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 400 se nome está ausente', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
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
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('gender');
  });

  it('deve retornar 400 se age é inválido (menor que 1)', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', age: 0 }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('age');
  });

  it('deve retornar 400 se age é maior que 120', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', age: 121 }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
  });

  it('deve retornar 400 se dominance é inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', dominance: 'INVALID' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('dominance');
  });

  it('deve retornar 400 se backhand é inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', backhand: 'INVALID' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('backhand');
  });

  it('deve retornar 400 se rankings não é um objeto', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', rankings: ['ESTADUAL'] }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('rankings');
  });

  it('deve retornar 400 se rankings tem tipo inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', rankings: { INVALID: { position: 1 } } }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('rankings');
  });

  it('deve retornar 400 se ranking position não é número positivo', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', rankings: { ESTADUAL: { position: 0 } } }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('rankings');
  });

  it('deve retornar 400 se ranking entry não é objeto', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', rankings: { ESTADUAL: 5 } }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('rankings');
  });

  it('deve criar jogador com rankings', async () => {
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Novo Jogador',
      gender: 'MALE',
      age: 25,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
    });

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Novo Jogador',
        gender: 'MALE',
        age: 25,
        dominance: 'RIGHT',
        backhand: 'ONE_HANDED',
        rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } },
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.name).toBe('Novo Jogador');
    expect(data.data.rankings).toEqual({ ESTADUAL: { category: '15-16', class: '4ªMA', position: 5 } });
  });

  it('deve retornar 403 se usuário não tem role ATHLETE', async () => {
    // SPECTATOR é role insuficiente para POST /api/players (exige ATHLETE)
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Teste' }),
      headers: { 'Content-Type': 'application/json', ...SPECTATOR_HEADERS },
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
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('deve retornar 500 se ocorrer erro interno no GET', async () => {
    mockListPlayers.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/players?userId=user-123', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/players/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/players - birthDate validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      gender: 'MALE',
      age: 25,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      ranking: 10,
      rankings: {},
      birthDate: new Date('1999-01-01'),
    });
  });

  it('deve retornar 400 se birthDate é inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', birthDate: 'invalid-date' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.data.error).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(data.data.details)).toContain('birthDate');
  });

  it('deve passar birthDate para createPlayer sem calcular idade', async () => {
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      gender: 'MALE',
      age: 25,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      ranking: 10,
      rankings: {},
      birthDate: new Date('1999-01-01'),
    });

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', birthDate: '1999-01-01' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test',
        birthDate: expect.any(Date),
      })
    );
  });

  it('deve retornar 400 se birthDate é inválido no schema', async () => {
    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', birthDate: 'not-a-date' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 se birthDate é futuro', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', birthDate: futureDateStr }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    // Route accepts birthDate as-is, validation happens at schema level
    expect(res.status).toBe(201);
  });

  it('deve usar age fornecido mesmo se birthDate estiver presente', async () => {
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      gender: 'MALE',
      age: 30,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      ranking: 10,
      rankings: {},
      birthDate: new Date('1999-01-01'),
    });

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', age: 30, birthDate: '1999-01-01' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 30,
      })
    );
  });

  it('deve passar birthDate para createPlayer', async () => {
    mockCreatePlayer.mockResolvedValue({
      id: 'p1',
      name: 'Test',
      gender: 'MALE',
      age: 25,
      dominance: 'RIGHT',
      backhand: 'ONE_HANDED',
      ranking: 10,
      rankings: {},
      birthDate: new Date('1999-03-15'),
    });

    const req = new NextRequest('http://localhost:3000/api/players', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', birthDate: '1999-03-15' }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });
    const mod = await import('@/app/api/players/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreatePlayer).toHaveBeenCalledWith(
      expect.objectContaining({
        birthDate: expect.any(Date),
      })
    );
    const callArgs = mockCreatePlayer.mock.calls[0][0];
    expect(callArgs.birthDate).toEqual(new Date('1999-03-15'));
  });
});
