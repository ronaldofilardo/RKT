jest.mock('@/lib/prisma', () => ({
  prisma: {},
}));

jest.mock('@/services/matchService', () => ({
  getMatch: jest.fn(),
  findAbandonedSessionSnapshot: jest.fn().mockResolvedValue(null),
}));

jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

jest.mock('@/core/scoring/engine', () => ({
  ScoringEngine: {
    fromSerialized: jest.fn().mockImplementation(() => ({
      getPointHistory: jest.fn().mockReturnValue([]),
    })),
  },
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/matches/[id]/report/route';
import { jwtVerify } from 'jose';
import { getMatch } from '@/services/matchService';

const mockJwtVerify = jwtVerify as jest.MockedFunction<typeof jwtVerify>;
const mockGetMatch = getMatch as jest.MockedFunction<typeof getMatch>;

const mockMatch = (overrides: Partial<any> = {}) => ({
  id: 'match-1',
  state: 'FINISHED',
  format: 'BEST_OF_3',
  initialServerId: 'p1',
  scoreState: { sets: [], currentGame: { player1: 0, player2: 0 }, server: 'player1', isFinished: true, winner: 'player1', setsWon: { player1: 0, player2: 0 } },
  startedAt: null,
  finishedAt: null,
  player1: { id: 'p1', name: 'Player 1' },
  player2: { id: 'p2', name: 'Player 2' },
  createdByUserId: 'creator-1',
  ...overrides,
});

function makeReq(userId: string = 'current-user', role: string = 'ATHLETE') {
  return new NextRequest('http://localhost:3000/api/matches/match-1/report', {
    headers: {
      authorization: 'Bearer fake-token',
      'x-user-id': userId,
      'x-user-role': role,
    },
  });
}

describe('GET /api/matches/[id]/report — autorização (regressão: anotador ≠ jogador)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // JWT válido por default; cada teste sobrepõe o payload se precisar
    mockJwtVerify.mockImplementation(async (token, secret) => ({
      payload: { sub: 'current-user', role: 'ATHLETE' },
    } as any));
  });

  it('permite acesso quando usuário é player1', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({ player1: { id: 'current-user', name: 'P1' } }) as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('permite acesso quando usuário é player2', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({ player2: { id: 'current-user', name: 'P2' } }) as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('permite acesso quando usuário é o CRIADOR da partida (regressão do bug 403 em Partidas Anotadas)', async () => {
    // Anotador criou a partida; player1/player2 são atletas distintos do anotador
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'athlete-1', name: 'Atleta 1' },
      player2: { id: 'athlete-2', name: 'Atleta 2' },
      createdByUserId: 'current-user',
    }) as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('permite acesso quando usuário é staff (ADMIN/GESTOR/COACH)', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
      createdByUserId: 'creator-1',
    }) as any);

    const res = await GET(makeReq('other-user', 'ADMIN'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(200);
  });

  it('bloqueia (403) quando usuário não é player, nem criador, nem staff', async () => {
    mockGetMatch.mockResolvedValue(mockMatch({
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
      createdByUserId: 'creator-1',
    }) as any);

    const res = await GET(makeReq('random-user', 'ATHLETE'), { params: Promise.resolve({ id: 'match-1' }) });
    expect(res.status).toBe(403);
  });

  it('retorna 404 quando partida não existe', async () => {
    mockGetMatch.mockResolvedValue(null as any);

    const res = await GET(makeReq(), { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});
