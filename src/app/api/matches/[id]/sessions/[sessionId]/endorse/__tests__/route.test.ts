jest.mock('@/lib/prisma', () => ({
  prisma: {
    matchAnnotationSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    annotationEndorsement: {
      create: jest.fn(),
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

describe('POST /api/matches/[id]/sessions/[sessionId]/endorse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserFromRequest.mockResolvedValue({ id: 'user-1', role: 'COACH' });
  });

  it('deve criar endorsement para sessão inativa', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      isActive: false,
    } as any);

    mockPrisma.annotationEndorsement.create.mockResolvedValue({
      id: 'endorsement-1',
      sessionId: 'session-1',
      endorsedByUserId: 'user-1',
      endorsedBy: { id: 'user-1', name: 'Coach', email: 'coach@test.com' },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/endorse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/endorse/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(201);
  });

  it('deve retornar 404 se sessão não existe', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/endorse', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/endorse/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(404);
  });

  it('deve retornar 400 se sessão está ativa', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      isActive: true,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/endorse', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/endorse/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('CANNOT_ENDORSE_ACTIVE_SESSION');
  });

  it('deve retornar 404 se sessionId não corresponde ao matchId', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'different-match',
      isActive: false,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/endorse', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/endorse/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(404);
  });

  it('deve retornar 409 se annotator tenta endossar própria sessão', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockResolvedValue({
      id: 'session-1',
      matchId: 'match-1',
      isActive: false,
      annotatorUserId: 'user-1',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/endorse', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/endorse/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('SELF_ENDORSEMENT');
  });

  it('deve retornar 401 se getUserFromRequest retorna null', async () => {
    mockGetUserFromRequest.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/endorse', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/endorse/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(401);
  });

  it('deve retornar 500 se ocorrer erro interno', async () => {
    mockPrisma.matchAnnotationSession.findUnique.mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost:3000/api/matches/match-1/sessions/session-1/endorse', {
      method: 'POST',
    });

    const mod = await import('@/app/api/matches/[id]/sessions/[sessionId]/endorse/route');
    const POST = mod.POST;

    const res = await POST(req, { params: Promise.resolve({ id: 'match-1', sessionId: 'session-1' }) });
    expect(res.status).toBe(500);
  });
});