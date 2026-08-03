jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchAnnotationSession: {
      findMany: jest.fn(),
    },
  },
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockPrisma = prisma as any;

let SPECTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  SPECTATOR_HEADERS = await makeAuthHeaders('user-1', 'SPECTATOR');
});

describe('GET /api/matches/suspended-sessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 401 se usuário não autenticado', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions');
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('FORBIDDEN');
  });

  it('deve retornar lista vazia se não há sessões suspensas', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions', {
      headers: SPECTATOR_HEADERS,
    });
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
          scoreState: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions', {
      headers: SPECTATOR_HEADERS,
    });
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

  it('deve usar snapshot do match quando sessão não tem matchStateSnapshot', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
      {
        id: 'session-snap',
        status: 'ABANDONED',
        matchStateSnapshot: null,
        finalStateSnapshot: null,
        endedAt: null,
        match: {
          id: 'match-snap',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          scoreState: { sets: [{ player1: 1, player2: 0 }] },
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-snap');
    expect(data.matches[0].scoreState).toEqual({ sets: [{ player1: 1, player2: 0 }] });
  });

  it('deve lidar com snapshot inválido (JSON corrompido)', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
      {
        id: 'session-invalid',
        annotatorUserId: 'user-1',
        isActive: true,
        status: 'ABANDONED',
        matchStateSnapshot: 'not-valid-json{{{',
        finalStateSnapshot: null,
        endedAt: null,
        match: {
          id: 'match-invalid',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          scoreState: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].scoreState).toBeNull();
  });

  it('deve retornar apenas sessões suspensas, sem adicionar partidas IN_PROGRESS sem sessão', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([
      {
        id: 'session-abandoned',
        status: 'ABANDONED',
        matchStateSnapshot: null,
        finalStateSnapshot: null,
        endedAt: null,
        annotatorUserId: 'user-1',
        isActive: true,
        match: {
          id: 'match-abandoned',
          state: 'IN_PROGRESS',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          scheduledAt: null,
          scoreState: null,
          player1: { id: 'p1', name: 'Player 1' },
          player2: { id: 'p2', name: 'Player 2' },
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(1);
    expect(data.matches[0].id).toBe('match-abandoned');
    expect(data.matches[0].suspendedSessionId).toBe('session-abandoned');
  });

  it('[CARACTERIZAÇÃO] não deve incluir partidas IN_PROGRESS sem sessão suspensa', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.matches).toHaveLength(0);
  });

  it('deve retornar 500 em erro interno', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches/suspended-sessions', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/suspended-sessions/route');
    const GET = mod.GET;

    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('INTERNAL_SERVER_ERROR');
  });
});