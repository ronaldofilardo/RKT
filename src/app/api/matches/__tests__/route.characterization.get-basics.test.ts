/**
 * CHARACTERIZATION — GET /api/matches (básicos).
 * Divisão da suíte original route.characterization.test.ts (452L);
 * cabeçalho completo (TD-029/TD-043/TD-044) e helpers: matchesRouteTestKit.ts.
 */
jest.mock('@/lib/prisma', () => require('./matchesRouteTestKit').prismaMock());
jest.mock('@/services/matchSuggestionService', () => require('./matchesRouteTestKit').duplicateServiceMock());
jest.mock('@/services/match-duplicate.service', () => require('./matchesRouteTestKit').duplicateServiceMock());

import { describe, it, expect } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { getMatches } from './matchesRouteTestKit';

const mockPrisma = prisma as any;

describe('GET /api/matches (characterization) — básicos', () => {
  it('deve retornar 200 com lista vazia de matches', async () => {
    mockPrisma.match.findMany.mockResolvedValue([]);

    const res = await getMatches('http://localhost:3000/api/matches');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeDefined();
    expect(json.data.matches).toEqual([]);
    expect(json.data.nextCursor).toBeNull();
  });

  it('deve retornar 401 sem autenticação', async () => {
    const res = await getMatches('http://localhost:3000/api/matches', null);

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

    const res = await getMatches('http://localhost:3000/api/matches');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.matches).toBeDefined();
    expect(Array.isArray(json.data.matches)).toBe(true);
  });
});
