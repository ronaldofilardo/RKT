jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/core/scoring/engine', () => ({
  ScoringEngine: {
    fromSerialized: jest.fn().mockImplementation(function(this: any, config: any, serialized: any) {
      const mockEngine = {
        isFinished: jest.fn().mockReturnValue(true),
        getState: jest.fn().mockReturnValue({
          sets: [{ player1: 6, player2: 4, isTiebreak: false }],
          currentGame: { player1: 0, player2: 0 },
          server: 'player1',
          isFinished: true,
          winner: 'player1',
        }),
      };
      return mockEngine;
    }),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { ScoringEngine } from '@/core/scoring/engine';

const mockPrisma = prisma as any;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('PATCH /api/matches/[id]/state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(null);
  });

  it('deve retornar 403 se usuário não tem role ATHLETE', async () => {
    mockRequireRole.mockResolvedValue(
      NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'IN_PROGRESS' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 se partida não existe', async () => {
    mockPrisma.match.findFirst.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'IN_PROGRESS' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(404);
  });

  it('deve iniciar partida com IN_PROGRESS', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    } as any);

    mockPrisma.match.update.mockResolvedValue({
      id: 'match-1',
      state: 'IN_PROGRESS',
      startedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'IN_PROGRESS' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'IN_PROGRESS',
          startedAt: expect.any(Date),
        }),
      })
    );
  });

  it('deve finalizar partida quando motor indica finished', async () => {
    const scoreState = {
      isFinished: true,
      winner: 'player1',
      sets: [{ player1: 6, player2: 4, isTiebreak: false }],
      currentGame: { player1: 0, player2: 0 },
      server: 'player1',
    };

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
      scoreState,
    } as any);

    mockPrisma.match.update.mockResolvedValue({
      id: 'match-1',
      state: 'FINISHED',
      finishedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'FINISHED' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'FINISHED',
          finishedAt: expect.any(Date),
        }),
      })
    );
  });

  it('deve retornar 422 se tentar finalizar sem scoreState', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
      scoreState: null,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'FINISHED' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toContain('CANNOT_FINISH');
  });

  it('deve persistir scoreState ao transitar para IN_PROGRESS', async () => {
    const scoreState = {
      sets: [],
      currentGame: { player1: 15, player2: 0 },
      server: 'player1',
      isFinished: false,
      winner: null,
    };

    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      state: 'SCHEDULED',
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    } as any);

    mockPrisma.match.update.mockResolvedValue({
      id: 'match-1',
      state: 'IN_PROGRESS',
      scoreState,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'IN_PROGRESS', scoreState }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
    expect(mockPrisma.match.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          state: 'IN_PROGRESS',
          scoreState,
        }),
      })
    );
  });

  it('deve retornar 400 para payload inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ invalid: 'payload' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(400);
  });

  it('deve retornar 500 quando ocurre erro inesperado', async () => {
    mockPrisma.match.findFirst.mockRejectedValue(new Error('Unexpected DB error'));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/state', {
      method: 'PATCH',
      body: JSON.stringify({ state: 'IN_PROGRESS' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/state/route');
    const PATCH = mod.PATCH;

    const res = await PATCH(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('INTERNAL_ERROR');
  });
});