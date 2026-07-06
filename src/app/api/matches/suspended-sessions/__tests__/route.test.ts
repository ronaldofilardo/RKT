jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchAnnotationSession: {
      findMany: jest.fn(),
    },
    match: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const mockPrisma = prisma as any;
const mockGetUserFromRequest = getUserFromRequest as jest.MockedFunction<typeof getUserFromRequest>;

describe('GET /api/matches/suspended-sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue({ id: 'user-1', role: 'COACH' });
  });

  it('deve retornar 401 se usuário não autenticado', async () => {
    mockGetUserFromRequest.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('deve retornar lista vazia se não há sessões suspensas', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([]);
    mockPrisma.match.findMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(0);
  });

  it('deve retornar partidas suspensas com snapshot da sessão', async () => {
    const snapshot = JSON.stringify({ sets: [{ player1: 3, player2: 2 }], currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false }, server: 'player1', isFinished: false, winner: null, setsWon: { player1: 0, player2: 0 }, startedAt: null, secondServe: false });

    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
      {
        id: 'session-1',
        status: 'ABANDONED',
        matchStateSnapshot: snapshot,
        finalStateSnapshot: null,
        endedAt: new Date('2024-01-01'),
        match: {
          id: 'match-1',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    mockPrisma.match.findMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-1');
    expect(data.matches[0].suspendedSessionId).toBe('session-1');
    expect(data.matches[0].scoreState).toBeTruthy();
    expect(data.matches[0].snapshotStatus).toBe('IN_SYNC');
    expect(data.matches[0].bankPointCount).toBe(0);
  });

  it('deve buscar snapshot do match quando sessão não tem matchStateSnapshot', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
      {
        id: 'session-2',
        status: 'ABANDONED',
        matchStateSnapshot: null,
        finalStateSnapshot: null,
        endedAt: null,
        match: {
          id: 'match-2',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    const matchScoreState = { sets: [{ player1: 1, player2: 0 }] };
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'match-2',
        scoreState: matchScoreState,
        version: 0,
        category: null,
        includeLet: null,
        state: 'IN_PROGRESS',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        scheduledAt: null,
        player1: { id: 'p1', name: 'Player 1' },
        player2: { id: 'p2', name: 'Player 2' },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches.length).toBeGreaterThanOrEqual(1);
  });

  it('deve deduplicar partidas por matchId', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
      {
        id: 'session-a',
        matchStateSnapshot: null,
        finalStateSnapshot: null,
        endedAt: null,
        match: {
          id: 'match-dup',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
      {
        id: 'session-b',
        matchStateSnapshot: null,
        finalStateSnapshot: null,
        endedAt: null,
        match: {
          id: 'match-dup',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    mockPrisma.match.findMany.mockResolvedValue([
      { id: 'match-dup', scoreState: { sets: [] }, version: 0 },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-dup');
  });

  it('deve lidar com snapshot inválido (JSON corrompido)', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
      {
        id: 'session-3',
        matchStateSnapshot: 'not-valid-json{{{',
        finalStateSnapshot: null,
        endedAt: null,
        match: {
          id: 'match-3',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    mockPrisma.match.findMany.mockResolvedValue([
      { id: 'match-3', scoreState: null, version: 0 },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].scoreState).toBeNull();
  });

  it('deve retornar 500 em erro interno', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('INTERNAL_SERVER_ERROR');
  });
});
