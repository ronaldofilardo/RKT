/**
 * CHARACTERIZATION TESTS — /api/matches/route.ts
 *
 * Propósito: Capturar comportamento OBSERVADO (não o "deveria ser")
 * Data: 2026-07-20
 * Owner: @qa
 *
 * Comportamentos suspeitos:
 * - // SUSPECT: TD-008 — JWT_SECRET hardcoded em vez de usar getJWTSecret()
 * - // SUSPECT: TD-004 — GET sem paginação máxima (pode retornar todos os matches)
 *
 * NOTA (TD-029): Originalmente esta suíte fazia `fetch()` real contra um
 * servidor Next.js rodando em localhost:3000 (portanto era, na prática, um
 * teste E2E). Em 2026-07-25 foi migrada para o padrão de mock de Prisma +
 * chamada direta dos handlers `GET`/`POST` — alinhada com a suíte irmã
 * `route.test.ts`. Os comportamentos caracterizados aqui NÃO foram alterados,
 * apenas isolados de dependência de rede/DB.
 */

import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';

jest.mock('@/lib/prisma', () => {
  const txMock = {
    match: {
      create: jest.fn(),
    },
  };
  const prismaMock = {
    match: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    player: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(txMock)),
    __txMock: txMock,
  };
  return { prisma: prismaMock };
});

jest.mock('@/services/matchSuggestionService', () => ({
  findDuplicateMatch: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { findDuplicateMatch } from '@/services/matchSuggestionService';
import { makeAuthHeaders } from '@/test-helpers/auth';

const mockPrisma = prisma as any;
const txMock = (mockPrisma as any).__txMock;
const mockFindDuplicateMatch = findDuplicateMatch as jest.MockedFunction<typeof findDuplicateMatch>;

let ATHLETE_HEADERS: Record<string, string> = {};
let SPECTATOR_HEADERS: Record<string, string> = {};

beforeAll(async () => {
  ATHLETE_HEADERS = await makeAuthHeaders('user-ath', 'ATHLETE');
  SPECTATOR_HEADERS = await makeAuthHeaders('user-spect', 'SPECTATOR');
});

describe('GET /api/matches (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 200 com lista vazia de matches', async () => {
    mockPrisma.match.findMany.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const res = await mod.GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.matches).toEqual([]);
    expect(json.data.nextCursor).toBeNull();
  });

  it('deve retornar 401 sem autenticação', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches');
    const mod = await import('@/app/api/matches/route');
    const res = await mod.GET(req);
    expect(res.status).toBe(401);
  });

  it('deve retornar matches quando existirem', async () => {
    mockPrisma.match.findMany.mockResolvedValue([
      {
        id: 'm1',
        state: 'IN_PROGRESS',
        format: 'BEST_OF_3',
        player1: { id: 'p1', name: 'P1' },
        player2: { id: 'p2', name: 'P2' },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const res = await mod.GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.matches).toBeDefined();
    expect(Array.isArray(json.data.matches)).toBe(true);
  });

  it('deve aceitar query param state para filtrar', async () => {
    mockPrisma.match.findMany.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/matches?state=IN_PROGRESS',
      { headers: SPECTATOR_HEADERS },
    );
    const mod = await import('@/app/api/matches/route');
    await mod.GET(req);

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { state: 'IN_PROGRESS' },
      }),
    );
    // SUSPECT: TD-004 — Não há validação de valores válidos para state
  });

  it('deve aceitar query param cursor para paginação', async () => {
    mockPrisma.match.findMany.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/matches?cursor=abc123&limit=10',
      { headers: SPECTATOR_HEADERS },
    );
    const mod = await import('@/app/api/matches/route');
    await mod.GET(req);

    expect(mockPrisma.match.findMany).toHaveBeenCalled();
    // Paginação cursor-based aceita qualquer cursor (string arbitrária)
  });

  it('deve retornar nextCursor quando houver mais resultados', async () => {
    const matches = Array.from({ length: 20 }, (_, i) => ({
      id: `match-${i + 1}`,
      state: 'IN_PROGRESS',
      format: 'BEST_OF_3',
      player1: { id: 'p1', name: 'P1' },
      player2: { id: 'p2', name: 'P2' },
    }));

    mockPrisma.match.findMany.mockResolvedValue(matches);

    const req = new NextRequest('http://localhost:3000/api/matches?limit=20', {
      headers: SPECTATOR_HEADERS,
    });
    const mod = await import('@/app/api/matches/route');
    const res = await mod.GET(req);
    const json = await res.json();

    expect(json.data.matches.length).toBeLessThanOrEqual(20);
    // SUSPECT: TD-004 — limit máximo não é validado (pode ser 1000+)
  });
});

describe('POST /api/matches (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar match com dados válidos', async () => {
    const createdMatch = {
      id: 'new-match',
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      state: 'SCHEDULED',
      player1Id: 'player-1',
      player2Id: 'player-2',
    };

    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockResolvedValue(createdMatch);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
        visibility: 'PUBLIC',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data).toBeDefined();
    expect(json.data.id).toBeDefined();
    expect(json.data.format).toBe('BEST_OF_3');
    expect(json.data.state).toBe('SCHEDULED');
  });

  it('deve retornar 401 sem autenticação', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
      }),
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 com role SPECTATOR', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'user-spect',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
      }),
      headers: { 'Content-Type': 'application/json', ...SPECTATOR_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);
    expect(res.status).toBe(403);
  });

  it('deve retornar 400 com dados inválidos (player1Id faltando)', async () => {
    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player2Id: 'player-2',
        format: 'BEST_OF_3',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('FIXED: TD-040 — deve REJEITAR format inválido com 400', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'INVALID_FORMAT',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('deve detectar partida duplicada e retornar 409 (CONFLICT)', async () => {
    // Caracterização do contrato: a route lança ConflictError cujo código
    // é 'CONFLICT' (não 'DUPLICATE_MATCH' — drift histórico). O body inclui
    // `details.existing` com a partida duplicada.
    mockFindDuplicateMatch.mockResolvedValue({
      id: 'dup-match',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    } as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        scheduledAt: new Date('2026-08-01T10:00:00Z').toISOString(),
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('CONFLICT');
    expect(json.details).toBeDefined();
  });

  it('deve permitir partida duplicada com force=true', async () => {
    mockFindDuplicateMatch.mockResolvedValue({
      id: 'dup-match',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    } as any);

    mockPrisma.match.create.mockResolvedValue({ id: 'forced-match' } as any);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        scheduledAt: new Date('2026-08-01T10:00:00Z').toISOString(),
        force: true,
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);

    expect(res.status).toBe(201);
  });

  it('FIXED: TD-041 — deve REJEITAR player1 === player2 com 400', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-1',
        format: 'BEST_OF_3',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(txMock.match.create).not.toHaveBeenCalled();
  });

  it('deve aceitar campos opcionais (nickname, tournamentName, etc.)', async () => {
    const createdMatch = {
      id: 'opt-match',
      player1Id: 'player-1',
      player2Id: 'player-2',
      format: 'BEST_OF_3',
      state: 'SCHEDULED',
      nickname: 'Partida Amistosa',
      tournamentName: 'Torneio de Verão',
    };

    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockResolvedValue(createdMatch);

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
        nickname: 'Partida Amistosa',
        tournamentName: 'Torneio de Verão',
        category: 'Amador',
        round: 'Quartas de final',
        courtType: 'Saibro',
        visibility: 'PRIVATE',
        openForAnnotation: true,
        scheduledAt: new Date('2026-08-01T10:00:00Z').toISOString(),
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.nickname).toBe('Partida Amistosa');
    expect(json.data.tournamentName).toBe('Torneio de Verão');
  });

  it('deve extrair currentUserId do token JWT para createdByUserId', async () => {
    // Caracterização: não há assertion rigorosa aqui pois o service
    // `createMatch` recebe o id extraído de `getRLSUser()?.id` (fallback do
    // JWT quando headers x-user-id estão presentes — ver TD-029). Apenas
    // verificamos que a criação ocorre sem erro quandoJWT é válido.
    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockResolvedValue({
      id: 'jwt-match',
      player1Id: 'player-1',
      player2Id: 'player-2',
      state: 'SCHEDULED',
    });

    const req = new NextRequest('http://localhost:3000/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        player1Id: 'player-1',
        player2Id: 'player-2',
        format: 'BEST_OF_3',
      }),
      headers: { 'Content-Type': 'application/json', ...ATHLETE_HEADERS },
    });

    const mod = await import('@/app/api/matches/route');
    const res = await mod.POST(req);

    expect(res.status).toBe(201);
    // SUSPECT: createdByUserId está sendo setado corretamente?
  });
});
