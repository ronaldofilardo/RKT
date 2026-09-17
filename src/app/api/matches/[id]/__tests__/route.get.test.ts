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

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { handleGetMatch } from '@/app/api/matches/[id]/route.get';
import { prisma } from '@/lib/prisma';
import { getRLSUser } from '@/lib/auth';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetRLSUser = getRLSUser as jest.MockedFunction<typeof getRLSUser>;

let ANNOTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ANNOTATOR_HEADERS = await makeAuthHeaders('user-1', 'ANNOTATOR');
});

function getReq() {
  return new NextRequest('http://localhost:3000/api/matches/match-1', {
    headers: ANNOTATOR_HEADERS,
  });
}

const baseMatchData = {
  id: 'match-1',
  state: 'SCHEDULED',
  format: 'BEST_OF_3',
  sportType: 'TENNIS',
  courtType: null,
  scheduledAt: null,
  startedAt: null,
  finishedAt: null,
  nickname: null,
  visibility: 'PRIVATE',
  isResuming: false,
  openForAnnotation: false,
  tournamentName: null,
  category: null,
  round: null,
  bracketType: null,
  temperature: null,
  humidity: null,
  version: 0,
  scoreState: null,
  initialServerId: null,
  player1Id: 'user-1',
  player2Id: 'user-2',
  createdByUserId: 'user-1',
  player1: { id: 'user-1', name: 'Player 1' },
  player2: { id: 'user-2', name: 'Player 2' },
  _count: { pointLog: 0 },
};

describe('GET /api/matches/[id] (route.get)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRLSUser.mockReturnValue({ id: 'user-1', role: 'ANNOTATOR' } as any);
  });

  it('deve retornar 401 quando RLS user não está presente', async () => {
    mockGetRLSUser.mockReturnValue(null as any);

    const res = await handleGetMatch(getReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('deve retornar 404 quando partida não existe', async () => {
    mockPrisma.match.findFirst.mockResolvedValue(null);

    const res = await handleGetMatch(getReq(), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('MATCH_NOT_FOUND');
  });

  it('deve retornar 403 quando usuário não tem acesso (não é player nem criador)', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      ...baseMatchData,
      id: 'match-1',
      player1Id: 'user-a',
      player2Id: 'user-b',
      createdByUserId: 'user-c',
    } as any);

    const res = await handleGetMatch(getReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('FORBIDDEN');
  });

  it('deve retornar match quando usuário é player1', async () => {
    mockGetRLSUser.mockReturnValue({ id: 'player-1', role: 'ANNOTATOR' } as any);
    mockPrisma.match.findFirst.mockResolvedValue({
      ...baseMatchData,
      player1Id: 'player-1',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1', {
      headers: await makeAuthHeaders('player-1', 'ANNOTATOR'),
    });

    const res = await handleGetMatch(req, {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('match-1');
  });

  it('deve retornar match quando usuário é player2', async () => {
    mockGetRLSUser.mockReturnValue({ id: 'player-2', role: 'ANNOTATOR' } as any);
    mockPrisma.match.findFirst.mockResolvedValue({
      ...baseMatchData,
      player1Id: 'player-1',
      player2Id: 'player-2',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1', {
      headers: await makeAuthHeaders('player-2', 'ANNOTATOR'),
    });

    const res = await handleGetMatch(req, {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('match-1');
  });

  it('deve retornar match quando usuário é o criador (não jogador)', async () => {
    mockGetRLSUser.mockReturnValue({ id: 'creator-1', role: 'ANNOTATOR' } as any);
    mockPrisma.match.findFirst.mockResolvedValue({
      ...baseMatchData,
      player1Id: 'athlete-1',
      player2Id: 'athlete-2',
      createdByUserId: 'creator-1',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches/match-1', {
      headers: await makeAuthHeaders('creator-1', 'ANNOTATOR'),
    });

    const res = await handleGetMatch(req, {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe('match-1');
  });

  it('deve retornar 500 quando ocorre erro inesperado', async () => {
    mockPrisma.match.findFirst.mockRejectedValue(new Error('DB error'));

    const res = await handleGetMatch(getReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('INTERNAL_ERROR');
  });

  it('deve incluir campos select corretos na query', async () => {
    mockPrisma.match.findFirst.mockResolvedValue({
      ...baseMatchData,
    } as any);

    await handleGetMatch(getReq(), {
      params: Promise.resolve({ id: 'match-1' }),
    });

    expect(mockPrisma.match.findFirst).toHaveBeenCalledWith({
      where: { id: 'match-1' },
      select: expect.objectContaining({
        id: true,
        state: true,
        format: true,
        sportType: true,
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
        _count: { select: { pointLog: true } },
      }),
    });
  });
});
