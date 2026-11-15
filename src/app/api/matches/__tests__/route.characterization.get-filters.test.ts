/**
 * CHARACTERIZATION — GET /api/matches (filtros e paginação).
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

describe('GET /api/matches (characterization) — filtros e paginação', () => {
  it('deve aceitar query param state para filtrar', async () => {
    mockPrisma.match.findMany.mockResolvedValue([]);

    await getMatches('http://localhost:3000/api/matches?state=IN_PROGRESS');

    expect(mockPrisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ state: 'IN_PROGRESS' }),
      }),
    );
    // Resolvido (TD-042): MatchStateSchema.safeParse valida state; 400 retornado se inválido
  });

  it('deve aceitar query param cursor para paginação', async () => {
    mockPrisma.match.findMany.mockResolvedValue([]);

    await getMatches('http://localhost:3000/api/matches?cursor=abc123&limit=10');

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

    const res = await getMatches('http://localhost:3000/api/matches?limit=20');
    const json = await res.json();

    expect(json.data.matches.length).toBeLessThanOrEqual(20);
    // Resolvido (TD-043): PAGINATION_LIMITS.MAX=100, extractPagination aplica cap + validação NaN
  });
});
