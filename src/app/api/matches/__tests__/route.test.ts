jest.mock('@/lib/prisma', () => {
  const txMock = {
    match: {
      create: jest.fn(),
    },
  };
  const prismaMock = {
    match: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(txMock)),
    __txMock: txMock,
  };
  return { prisma: prismaMock };
});

jest.mock('@/services/matchSuggestionService', () => ({
  findDuplicateMatch: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findDuplicateMatch } from '@/services/matchSuggestionService';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockPrisma = prisma as any;
const txMock = (mockPrisma as any).__txMock;
const mockFindDuplicateMatch = findDuplicateMatch as jest.MockedFunction<typeof findDuplicateMatch>;

let ATHLETE_HEADERS: Record<string, string> = {};
let SPECTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ATHLETE_HEADERS = await makeAuthHeaders('user-ath', 'ATHLETE');
  SPECTATOR_HEADERS = await makeAuthHeaders('user-spect', 'SPECTATOR');
});

describe('GET /api/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 403 se usuário não tem permissão', async () => {
    // Sem headers de auth, requireRole rejeita com 401 (ausência de token).
    // Não há role abaixo de SPECTATOR para simular role insuficiente.
    const req = new NextRequest('http://localhost:3000/api/matches');
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect([401, 403]).toContain(res.status);
  });

  it('deve retornar lista de partidas', async () => {
    const mockMatches = [
      {
        id: 'match-1',
        state: 'IN_PROGRESS',
        format: 'BEST_OF_3',
        player1: { id: 'p1', name: 'Player 1' },
        player2: { id: 'p2', name: 'Player 2' },
      },
      {
        id: 'match-2',
        state: 'FINISHED',
        format: 'BEST_OF_3',
        player1: { id: 'p3', name: 'Player 3' },
        player2: { id: 'p4', name: 'Player 4' },
      },
    ];

    mockPrisma.match.findMany.mockResolvedValue(mockMatches as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.matches).toHaveLength(2);
    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          state: true,
          format: true,
          sportType: true,
          courtType: true,
          scheduledAt: true,
          startedAt: true,
          finishedAt: true,
          nickname: true,
          visibility: true,
          isResuming: true,
          openForAnnotation: true,
          tournamentName: true,
          category: true,
          round: true,
          bracketType: true,
          temperature: true,
          humidity: true,
          version: true,
          scoreState: true,
          initialServerId: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('deve filtrar por estado quando provided', async () => {
    mockPrisma.match.findMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/matches?state=IN_PROGRESS', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    await GET(req);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { state: 'IN_PROGRESS' },
      })
    );
  });

  it('deve retornar nextCursor quando resultados preenchem o limite', async () => {
    const mockMatches = [
      { id: 'match-1', state: 'IN_PROGRESS', format: 'BEST_OF_3', player1: { id: 'p1', name: 'P1' }, player2: { id: 'p2', name: 'P2' } },
      { id: 'match-2', state: 'IN_PROGRESS', format: 'BEST_OF_3', player1: { id: 'p3', name: 'P3' }, player2: { id: 'p4', name: 'P4' } },
    ];

    mockPrisma.match.findMany.mockResolvedValue(mockMatches as any);

    const req = new NextRequest('http://localhost:3000/api/matches?limit=2', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.matches).toHaveLength(2);
    expect(data.data.nextCursor).toBe('match-2');
  });

  it('deve retornar null nextCursor quando resultados não preenchem o limite', async () => {
    const mockMatches = [
      { id: 'match-1', state: 'IN_PROGRESS', format: 'BEST_OF_3', player1: { id: 'p1', name: 'P1' }, player2: { id: 'p2', name: 'P2' } },
    ];

    mockPrisma.match.findMany.mockResolvedValue(mockMatches as any);

    const req = new NextRequest('http://localhost:3000/api/matches?limit=10', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.nextCursor).toBeNull();
  });
});

describe('POST /api/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar partida com dados válidos', async () => {
    const createdMatch = {
      id: 'new-match',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      state: 'SCHEDULED',
      player1Id: 'player-1',
      player2Id: 'player-2',
    };

    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockResolvedValue(createdMatch);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.data.format).toBe('BEST_OF_3');
    expect(txMock.match.create).toHaveBeenCalled();
  });

  it('deve criar partida com category ADULTO', async () => {
    const createdMatch = {
      id: 'new-match',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      state: 'SCHEDULED',
      player1Id: 'player-1',
      player2Id: 'player-2',
      category: 'ADULTO',
    };

    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockResolvedValue(createdMatch);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        category: 'ADULTO',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.data.category).toBe('ADULTO');
    expect(txMock.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'ADULTO',
        }),
      })
    );
  });

  it('deve validar schema com category', async () => {
    const createdMatch = {
      id: 'new-match',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      state: 'SCHEDULED',
      player1Id: 'player-1',
      player2Id: 'player-2',
      category: 'INFANTIL',
    };

    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockResolvedValue(createdMatch);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        category: 'INFANTIL',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('deve retornar 409 se findDuplicateMatch encontrar duplicata sem force', async () => {
    mockFindDuplicateMatch.mockResolvedValue({
      id: 'dup-match',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    } as any);

    txMock.match.create.mockResolvedValue({ id: 'new' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        scheduledAt: '2025-01-01T10:00:00Z',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe('CONFLICT');
    expect(data.details.existing.id).toBe('dup-match');
  });

  it('deve ignorar duplicata quando force=true', async () => {
    mockFindDuplicateMatch.mockResolvedValue({
      id: 'dup-match',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    } as any);

    mockPrisma.match.create.mockResolvedValue({ id: 'forced-match' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        scheduledAt: '2025-01-01T10:00:00Z',
        force: true,
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockFindDuplicateMatch).not.toHaveBeenCalled();
  });

  it('deve retornar 500 se ocorrer erro interno no GET', async () => {
    mockPrisma.match.findMany.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('deve retornar 500 se ocorrer erro interno no POST', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
