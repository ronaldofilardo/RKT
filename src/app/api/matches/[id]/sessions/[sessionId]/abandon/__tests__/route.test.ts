jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchAnnotationSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    match: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth', () => ({
  getUserFromRequest: jest.fn(),
  requireRole: jest.fn(() => Promise.resolve(null)),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const mockPrisma = prisma as any;
const mockGetUserFromRequest = getUserFromRequest as jest.MockedFunction<typeof getUserFromRequest>;

describe('POST /api/matches/[id]/sessions/[sessionId]/abandon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue({ id: 'user-1', role: 'COACH' });
  });

  it('deve abandonar sessão ativa', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: true,
      status: 'IN_PROGRESS',
    } as any);

    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      scoreState: { sets: [] },
    } as any);

    mockPrisma.matchAnnotationSession.update.mockResolvedValue({
      id: 'session-1',
      status: 'ABANDONED',
      isActive: false,
      annotator: { id: 'user-1', name: 'Coach', email: 'coach@test.com' },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(200);
  });

  it('deve retornar 404 se sessão não existe', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(404);
  });

  it('deve retornar 403 se usuário não é annotator nem admin', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'other-user',
      isActive: true,
      status: 'IN_PROGRESS',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(403);
  });

  it('deve retornar 403 para admin tentando abandonar sessão de outro', async () => {
    mockGetUserFromRequest.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'other-user',
      isActive: true,
      status: 'IN_PROGRESS',
    } as any);

    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      scoreState: null,
    } as any);

    mockPrisma.matchAnnotationSession.update.mockResolvedValue({
      id: 'session-1',
      status: 'ABANDONED',
      isActive: false,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).not.toBe(403);
  });

  it('deve retornar 400 se sessão já foi completada', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: false,
      status: 'COMPLETED',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('Session already ended');
  });

  it('deve usar matchStateSnapshot do corpo ou buscar do match', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: true,
      status: 'IN_PROGRESS',
    } as any);

    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      scoreState: { sets: [{ player1: 1, player2: 0 }] },
    } as any);

    mockPrisma.matchAnnotationSession.update.mockResolvedValue({
      id: 'session-1',
      status: 'ABANDONED',
      isActive: false,
      matchStateSnapshot: '{"sets":[{"player1":1,"player2":0}]}',
      annotator: { id: 'user-1', name: 'Coach', email: 'coach@test.com' },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchStateSnapshot: '{"sets":[{"player1":1,"player2":0}]}' }),
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(200);
  });

  it('deve retornar already ended para sessão ABANDONED', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: false,
      status: 'ABANDONED',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    const data = await res.json();
    expect(data.message).toBe('Session already ended');
    expect(data.status).toBe('ABANDONED');
  });

  it('deve usar match.scoreState como fallback quando matchStateSnapshot não fornecido', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: true,
      status: 'IN_PROGRESS',
    } as any);

    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      scoreState: '{"sets":[]}',
    } as any);

    mockPrisma.matchAnnotationSession.update.mockResolvedValue({
      id: 'session-1',
      status: 'ABANDONED',
      isActive: false,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(200);

    expect(mockPrisma.matchAnnotationSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          matchStateSnapshot: '{"sets":[]}',
        }),
      })
    );
  });

  it('deve serializar match.scoreState como JSON quando é objeto', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: true,
      status: 'IN_PROGRESS',
    } as any);

    const scoreStateObj = { sets: [{ player1: 1, player2: 0 }] };
    mockPrisma.match.findUnique.mockResolvedValue({
      id: 'match-1',
      scoreState: scoreStateObj,
    } as any);

    mockPrisma.matchAnnotationSession.update.mockResolvedValue({
      id: 'session-1',
      status: 'ABANDONED',
      isActive: false,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(200);

    expect(mockPrisma.matchAnnotationSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          matchStateSnapshot: JSON.stringify(scoreStateObj),
        }),
      })
    );
  });

  it('deve retornar 401 se getUserFromRequest retorna null', async () => {
    mockGetUserFromRequest.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(401);
  });

  it('deve retornar 400 se body é inválido (schema validation)', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      annotatorUserId: 'user-1',
      isActive: true,
      status: 'IN_PROGRESS',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      body: JSON.stringify({ matchStateSnapshot: 12345 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(400);
  });

  it('deve retornar 500 se ocorrer erro interno inesperado', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockRejectedValue(new Error('Unexpected DB error'));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/abandon', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/abandon/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('INTERNAL_SERVER_ERROR');
  });
});