const mockTx = {
  match: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  pointLog: {
    count: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn((cb: Function) => cb(mockTx)),
  },
}));

jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/core/scoring/engine', () => ({
  ScoringEngine: jest.fn().mockImplementation(function(this: any) {
    this.applyPoint = jest.fn().mockReturnValue({
      sets: [],
      currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    });
    this.isFinished = jest.fn().mockReturnValue(false);
    this.getState = jest.fn().mockReturnValue({
      sets: [],
      currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      server: 'player1',
      isFinished: false,
      winner: null,
      setsWon: { player1: 0, player2: 0 },
      startedAt: null,
      secondServe: false,
    });
    this.fromSerialized = jest.fn().mockImplementation(function() {
      return new (jest.requireActual('@/core/scoring/engine').ScoringEngine)(
        { format: 'BEST_OF_3', player1Id: 'p1', player2Id: 'p2', initialServerId: 'p1' },
        {
          sets: [],
          currentGame: { player1: 1, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          isFinished: false,
          winner: null,
          setsWon: { player1: 0, player2: 0 },
          startedAt: null,
          secondServe: false,
        }
      );
    });
  }),
}));

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('POST /api/matches/[id]/point', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(null);
  });

  const mockMatch = (overrides = {}) => ({
    id: 'match-1',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
    version: 1,
    player1: { id: 'p1', name: 'Player 1' },
    player2: { id: 'p2', name: 'Player 2' },
    ...overrides,
  });

  it('deve retornar 403 se usuário não tem role ATHLETE', async () => {
    mockRequireRole.mockResolvedValue(
      NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({ winnerId: 'cjs5nqpr7000001l29u6qr9f1', type: 'WINNER', serverId: 'cjs5nqpr7000001l29u6qr9f2' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 se partida não existe', async () => {
    mockTx.match.findFirst.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({ winnerId: 'cjs5nqpr7000001l29u6qr9f1', type: 'WINNER', serverId: 'cjs5nqpr7000001l29u6qr9f2' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(404);
  });

  it('deve retornar 422 se partida não está IN_PROGRESS', async () => {
    mockTx.match.findFirst.mockResolvedValue(mockMatch({ state: 'SCHEDULED' }));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({ winnerId: 'cjs5nqpr7000001l29u6qr9f1', type: 'WINNER', serverId: 'cjs5nqpr7000001l29u6qr9f2' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe('MATCH_NOT_IN_PROGRESS');
  });

  it('deve retornar 422 se não há initialServerId', async () => {
    mockTx.match.findFirst.mockResolvedValue(mockMatch({ initialServerId: null }));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({ winnerId: 'cjs5nqpr7000001l29u6qr9f1', type: 'WINNER', serverId: 'cjs5nqpr7000001l29u6qr9f2' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(422);
  });

  it('deve registrar ponto e retornar novo estado', async () => {
    mockTx.match.findFirst.mockResolvedValue(mockMatch());
    mockTx.match.update.mockResolvedValue(mockMatch());
    mockTx.pointLog.create.mockResolvedValue({ id: 'point-1' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: 'cjs5nqpr7000001l29u6qr9f1',
        type: 'WINNER',
        serverId: 'cjs5nqpr7000001l29u6qr9f2',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.scoreState).toBeDefined();
    expect(mockTx.pointLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        matchId: 'match-1',
        winnerId: 'cjs5nqpr7000001l29u6qr9f1',
        type: 'WINNER',
        serverId: 'cjs5nqpr7000001l29u6qr9f2',
      }),
    });
  });

  it('deve retornar 400 para payload inválido', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'payload' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(400);
  });

  it('deve aceitar winnerId e serverId em formato prefixed UUID', async () => {
    mockTx.match.findFirst.mockResolvedValue(mockMatch());
    mockTx.match.update.mockResolvedValue(mockMatch());
    mockTx.pointLog.create.mockResolvedValue({ id: 'point-1' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: 'pa2da1636-d6c4-4184-8fca-8dd8d5d8f3f9',
        type: 'UNFORCED_ERROR',
        serverId: 'pac07fc77-ffd3-466e-af56-0ffc079d158a',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.scoreState).toBeDefined();
    expect(mockTx.pointLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        matchId: 'match-1',
        winnerId: 'pa2da1636-d6c4-4184-8fca-8dd8d5d8f3f9',
        type: 'UNFORCED_ERROR',
        serverId: 'pac07fc77-ffd3-466e-af56-0ffc079d158a',
      }),
    });
  });

  it('deve retornar 409 se sequenceNumber conflita', async () => {
    mockTx.match.findFirst.mockResolvedValue(mockMatch());
    mockTx.pointLog.count.mockResolvedValue(5);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: 'cjs5nqpr7000001l29u6qr9f1',
        type: 'WINNER',
        serverId: 'cjs5nqpr7000001l29u6qr9f2',
        sequenceNumber: 7,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe('SEQUENCE_CONFLICT');
    expect(data.expectedSequence).toBe(6);
  });

  it('deve registrar ponto com sequenceNumber válido', async () => {
    mockTx.match.findFirst.mockResolvedValue(mockMatch());
    mockTx.pointLog.count.mockResolvedValue(0);
    mockTx.match.update.mockResolvedValue(mockMatch());
    mockTx.pointLog.create.mockResolvedValue({ id: 'point-1' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: 'cjs5nqpr7000001l29u6qr9f1',
        type: 'WINNER',
        serverId: 'cjs5nqpr7000001l29u6qr9f2',
        sequenceNumber: 1,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.scoreState).toBeDefined();
  });

  it('deve retornar 409 VERSION_CONFLICT quando version diverge', async () => {
    const { Prisma } = await import('@prisma/client');
    mockTx.match.findFirst.mockResolvedValue(mockMatch({ version: 1 }));
    mockTx.match.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.17.0',
      })
    );

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: 'cjs5nqpr7000001l29u6qr9f1',
        type: 'WINNER',
        serverId: 'cjs5nqpr7000001l29u6qr9f2',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe('VERSION_CONFLICT');
  });

  it('deve retornar 500 quando ocurre erro inesperado no catch', async () => {
    mockTx.match.findFirst.mockRejectedValue(new Error('Unexpected DB error'));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/point', {
      method: 'POST',
      body: JSON.stringify({
        winnerId: 'cjs5nqpr7000001l29u6qr9f1',
        type: 'WINNER',
        serverId: 'cjs5nqpr7000001l29u6qr9f2',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/point/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('INTERNAL_ERROR');
  });
});