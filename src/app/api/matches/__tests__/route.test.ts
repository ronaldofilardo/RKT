jest.mock('@/lib/prisma', () => ({
  prisma: {
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
  },
}));

jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(),
  getUserFromRequest: jest.fn(),
}));

jest.mock('@/services/matchSuggestionService', () => ({
  findDuplicateMatch: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { findDuplicateMatch } from '@/services/matchSuggestionService';

const mockPrisma = prisma as any;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockFindDuplicateMatch = findDuplicateMatch as jest.MockedFunction<typeof findDuplicateMatch>;

function setupRequireRoleMock() {
  mockRequireRole.mockResolvedValue(null);
}

function setupRequireRoleForbidden() {
  mockRequireRole.mockResolvedValue(
    NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  );
}

describe('GET /api/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupRequireRoleMock();
  });

  it('deve retornar 403 se usuário não tem permissão', async () => {
    setupRequireRoleForbidden();

    const req = new NextRequest('http://localhost:3000/api/matches');
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(403);
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

    const req = new NextRequest('http://localhost:3000/api/matches');
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(2);
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
          includeLet: true,
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

    const req = new NextRequest('http://localhost:3000/api/matches?state=IN_PROGRESS');
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

    const req = new NextRequest('http://localhost:3000/api/matches?limit=2');
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(2);
    expect(data.nextCursor).toBe('match-2');
  });

  it('deve retornar null nextCursor quando resultados não preenchem o limite', async () => {
    const mockMatches = [
      { id: 'match-1', state: 'IN_PROGRESS', format: 'BEST_OF_3', player1: { id: 'p1', name: 'P1' }, player2: { id: 'p2', name: 'P2' } },
    ];

    mockPrisma.match.findMany.mockResolvedValue(mockMatches as any);

    const req = new NextRequest('http://localhost:3000/api/matches?limit=10');
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.nextCursor).toBeNull();
  });
});

describe('POST /api/matches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupRequireRoleMock();
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

    mockPrisma.match.create.mockResolvedValue(createdMatch as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.format).toBe('BEST_OF_3');
    expect(mockPrisma.match.create).toHaveBeenCalled();
  });

  it('deve criar partida com category e includeLet', async () => {
    const createdMatch = {
      id: 'new-match',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      state: 'SCHEDULED',
      player1Id: 'player-1',
      player2Id: 'player-2',
      category: 'JUVENIL',
      includeLet: true,
    };

    mockPrisma.match.create.mockResolvedValue(createdMatch as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        category: 'JUVENIL',
        includeLet: true,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.category).toBe('JUVENIL');
    expect(data.includeLet).toBe(true);
    expect(mockPrisma.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'JUVENIL',
          includeLet: true,
        }),
      })
    );
  });

  it('deve criar partida com category ADULTO sem includeLet', async () => {
    const createdMatch = {
      id: 'new-match',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      state: 'SCHEDULED',
      player1Id: 'player-1',
      player2Id: 'player-2',
      category: 'ADULTO',
      includeLet: null,
    };

    mockPrisma.match.create.mockResolvedValue(createdMatch as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        category: 'ADULTO',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.category).toBe('ADULTO');
    expect(mockPrisma.match.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'ADULTO',
          includeLet: null,
        }),
      })
    );
  });

  it('deve validar schema com category e includeLet', async () => {
    const createdMatch = {
      id: 'new-match',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      state: 'SCHEDULED',
      player1Id: 'player-1',
      player2Id: 'player-2',
      category: 'INFANTIL',
      includeLet: null,
    };

    mockPrisma.match.create.mockResolvedValue(createdMatch as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        category: 'INFANTIL',
        includeLet: null,
      }),
      headers: { 'Content-Type': 'application/json' },
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

    mockPrisma.match.create.mockResolvedValue({ id: 'new' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        scheduledAt: '2025-01-01T10:00:00Z',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe('DUPLICATE_MATCH');
    expect(data.existing.id).toBe('dup-match');
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
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockFindDuplicateMatch).not.toHaveBeenCalled();
  });

  it('deve retornar 500 se ocorrer erro interno no GET', async () => {
    mockPrisma.match.findMany.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches');
    const mod = await import('@/app/api/matches/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('deve retornar 500 se ocorrer erro interno no POST', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);
    mockPrisma.match.create.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/route');
    const POST = mod.POST;

    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});