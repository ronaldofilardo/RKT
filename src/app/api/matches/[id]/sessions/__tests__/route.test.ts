jest.mock('@/lib/prisma', () => {
  const tx: any = {
    matchAnnotationSession: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  return {
    prisma: {
      $transaction: jest.fn((fn: any) => fn(tx)),
      match: {
        findUnique: jest.fn(),
      },
      matchAnnotationSession: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    },
  };
});

jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn(),
  getUserFromRequest: jest.fn(),
}));

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, getUserFromRequest } from '@/lib/auth';

beforeEach(() => {
  jest.clearAllMocks();
});

const mockPrisma = prisma as any;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockGetUserFromRequest = getUserFromRequest as jest.MockedFunction<typeof getUserFromRequest>;

describe('GET /api/matches/[id]/sessions', () => {
  beforeEach(() => {
    mockRequireRole.mockResolvedValue(null);
  });

  it('deve retornar 403 se usuário não tem role SPECTATOR', async () => {
    mockRequireRole.mockResolvedValue(
      NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions');
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const GET = mod.GET;

    const res = await GET(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(403);
  });

  it('deve retornar lista de sessões', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        matchId: 'match-1',
        annotatorUserId: 'user-1',
        isActive: true,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        annotator: { id: 'user-1', name: 'Coach 1', email: 'coach1@test.com' },
        endorsements: [],
      },
    ];

    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue(mockSessions as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions');
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const GET = mod.GET;

    const res = await GET(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(mockPrisma.matchAnnotationSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { matchId: 'match-1' },
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('deve retornar 500 se ocorrer erro interno no GET', async () => {
    mockPrisma.matchAnnotationSession.findMany.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions');
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const GET = mod.GET;

    const res = await GET(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('INTERNAL_SERVER_ERROR');
  });
});

describe('POST /api/matches/[id]/sessions', () => {
  beforeEach(() => {
    mockRequireRole.mockResolvedValue(null);
    mockGetUserFromRequest.mockResolvedValue({ id: 'user-1', role: 'COACH' });
  });

  it('deve retornar 403 se usuário não tem role COACH', async () => {
    mockRequireRole.mockResolvedValue(
      NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(403);
  });

  it('deve retornar 404 se partida não existe', async () => {
    mockPrisma.match.findUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(404);
  });

  it('deve retornar 409 se partida já terminou', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({ state: 'FINISHED' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('MATCH_ALREADY_FINISHED');
  });

  it('deve criar nova sessão quando não existe sessão anterior', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({ state: 'IN_PROGRESS', openForAnnotation: true } as any);
    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([]);
    mockPrisma.$transaction.mockImplementation((fn: any) => fn({ matchAnnotationSession: { create: jest.fn().mockResolvedValue({
      id: 'new-session',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: true,
      status: 'IN_PROGRESS',
      annotator: { id: 'user-1', name: 'Coach 1', email: 'coach@test.com' },
    }) } }));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe('new-session');
  });

  it('deve reativar sessão suspensa', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({ state: 'IN_PROGRESS', openForAnnotation: true } as any);

    const previousSession = {
      id: 'old-session',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: false,
      status: 'ABANDONED',
      matchStateSnapshot: JSON.stringify({ sets: [] }),
      annotator: { id: 'user-1', name: 'Coach 1', email: 'coach@test.com' },
    };

    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([previousSession] as any);
    mockPrisma.$transaction.mockImplementation((fn: any) => fn({ matchAnnotationSession: { update: jest.fn().mockResolvedValue({
      ...previousSession,
      isActive: true,
      status: 'IN_PROGRESS',
    }) } }));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suspended).toBe(true);
  });

  it('deve retornar sessão suspensa com autoStarted=true quando já existe sessão inativa', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({ state: 'IN_PROGRESS' } as any);

    const suspendedSession = {
      id: 'suspended-session',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: false,
      status: 'ABANDONED',
      matchStateSnapshot: JSON.stringify({ state: 'IN_PROGRESS', history: [] }),
      annotator: { id: 'user-1', name: 'Coach 1', email: 'coach@test.com' },
    };

    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([suspendedSession] as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoStarted: true }),
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.suspended).toBe(true);
    expect(data.previousState).toEqual({ state: 'IN_PROGRESS', history: [] });
  });

  it('deve retornar sessão suspensa com previousState=null quando matchStateSnapshot é null', async () => {
    mockPrisma.match.findUnique.mockResolvedValue({ state: 'IN_PROGRESS' } as any);

    const suspendedSession = {
      id: 'suspended-session',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: false,
      status: 'ABANDONED',
      matchStateSnapshot: null,
      annotator: { id: 'user-1', name: 'Coach 1', email: 'coach@test.com' },
    };

    mockPrisma.matchAnnotationSession.findMany.mockResolvedValue([suspendedSession] as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoStarted: true }),
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    const data = await res.json();

    expect(data.previousState).toBeNull();
  });

  it('deve retornar 401 se getUserFromRequest retorna null', async () => {
    mockGetUserFromRequest.mockResolvedValue(null);
    mockPrisma.match.findUnique.mockResolvedValue({ state: 'IN_PROGRESS' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(401);
  });

  it('deve retornar 500 se ocorrer erro interno no POST', async () => {
    mockGetUserFromRequest.mockResolvedValue({ id: 'user-1', role: 'COACH' });
    mockPrisma.match.findUnique.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const mod = await import('@/app/api/matches/[id]/sessions/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('INTERNAL_SERVER_ERROR');
  });
});
