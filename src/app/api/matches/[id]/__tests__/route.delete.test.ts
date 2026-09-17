jest.mock('@/lib/auth', () => ({
  withRLSHandler: jest.fn(async (_req: any, _role: string, handler: Function) => handler()),
  getRLSUser: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/services/matchService', () => ({
  deleteMatch: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { handleDeleteMatch } from '@/app/api/matches/[id]/route.delete';
import { prisma } from '@/lib/prisma';
import { deleteMatch } from '@/services/matchService';
import { getRLSUser } from '@/lib/auth';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockDeleteMatch = deleteMatch as jest.MockedFunction<typeof deleteMatch>;
const mockGetRLSUser = getRLSUser as jest.MockedFunction<typeof getRLSUser>;

let ANNOTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ANNOTATOR_HEADERS = await makeAuthHeaders('user-1', 'ANNOTATOR');
});

function deleteReq(type = 'soft', reason?: string) {
  const url = new URL('http://localhost:3000/api/matches/match-1');
  url.searchParams.set('type', type);
  if (reason) url.searchParams.set('reason', reason);
  return new NextRequest(url, {
    method: 'DELETE',
    headers: ANNOTATOR_HEADERS,
  });
}

describe('DELETE /api/matches/[id] (route.delete)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRLSUser.mockReturnValue({ id: 'user-1', role: 'ANNOTATOR' } as any);
  });

  it('deve retornar 401 quando RLS user não está presente', async () => {
    mockGetRLSUser.mockReturnValue(null as any);

    const res = await handleDeleteMatch(deleteReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('deve retornar 404 quando partida não existe', async () => {
    mockPrisma.match.findFirst.mockResolvedValue(null);

    const res = await handleDeleteMatch(deleteReq(), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('MATCH_NOT_FOUND');
    expect(mockDeleteMatch).not.toHaveBeenCalled();
  });

  it('deve retornar 403 quando usuário não é o criador da partida', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'other-user',
    });

    const res = await handleDeleteMatch(deleteReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('FORBIDDEN');
    expect(mockDeleteMatch).not.toHaveBeenCalled();
  });

  it('deve retornar 400 quando type é inválido', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'user-1',
    });

    const res = await handleDeleteMatch(deleteReq('invalid'), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('VALIDATION_ERROR');
    expect(mockDeleteMatch).not.toHaveBeenCalled();
  });

  it('deve realizar soft delete com sucesso', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'user-1',
    });
    mockDeleteMatch.mockResolvedValue({ success: true, type: 'soft' } as any);

    const res = await handleDeleteMatch(deleteReq('soft'), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDeleteMatch).toHaveBeenCalledWith('match-1', {
      type: 'soft',
      reason: undefined,
      deletedBy: 'user-1',
    });
  });

  it('deve realizar hard delete com sucesso', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'user-1',
    });
    mockDeleteMatch.mockResolvedValue({
      success: true,
      type: 'hard',
      stats: { points: 10, annotationSessions: 2 },
    } as any);

    const res = await handleDeleteMatch(deleteReq('hard'), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.type).toBe('hard');
    expect(mockDeleteMatch).toHaveBeenCalledWith('match-1', {
      type: 'hard',
      reason: undefined,
      deletedBy: 'user-1',
    });
  });

  it('deve passar reason quando fornecido', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'user-1',
    });
    mockDeleteMatch.mockResolvedValue({ success: true, type: 'soft' } as any);

    await handleDeleteMatch(deleteReq('soft', 'match was a mistake'), {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(mockDeleteMatch).toHaveBeenCalledWith('match-1', {
      type: 'soft',
      reason: 'match was a mistake',
      deletedBy: 'user-1',
    });
  });

  it('deve retornar 404 quando deleteMatch retorna MATCH_NOT_FOUND', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'user-1',
    });
    mockDeleteMatch.mockResolvedValue({ error: 'MATCH_NOT_FOUND' } as any);

    const res = await handleDeleteMatch(deleteReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('MATCH_NOT_FOUND');
  });

  it('deve retornar 422 quando deleteMatch retorna erro de domínio', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'user-1',
    });
    mockDeleteMatch.mockResolvedValue({
      error: 'CANNOT_DELETE_FINISHED',
    } as any);

    const res = await handleDeleteMatch(deleteReq('hard'), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(422);
    expect(data.error).toBe('CANNOT_DELETE_FINISHED');
  });

  it('deve retornar 500 quando ocorre erro inesperado', async () => {
    mockPrisma.match.findFirst.mockRejectedValue(new Error('DB error'));

    const res = await handleDeleteMatch(deleteReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('INTERNAL_ERROR');
  });

  it('deve usar type default "soft" quando não fornecido', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      id: 'match-1',
      createdByUserId: 'user-1',
    });
    mockDeleteMatch.mockResolvedValue({ success: true, type: 'soft' } as any);

    const url = new URL('http://localhost:3000/api/matches/match-1');
    const req = new NextRequest(url, {
      method: 'DELETE',
      headers: ANNOTATOR_HEADERS,
    });

    await handleDeleteMatch(req, {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(mockDeleteMatch).toHaveBeenCalledWith('match-1', {
      type: 'soft',
      reason: undefined,
      deletedBy: 'user-1',
    });
  });
});
