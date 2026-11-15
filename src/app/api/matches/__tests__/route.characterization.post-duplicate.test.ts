/**
 * CHARACTERIZATION — POST /api/matches (partida duplicada).
 * Divisão da suíte original route.characterization.test.ts (452L);
 * cabeçalho completo (TD-029/TD-043/TD-044) e helpers: matchesRouteTestKit.ts.
 */
jest.mock('@/lib/prisma', () => require('./matchesRouteTestKit').prismaMock());
jest.mock('@/services/matchSuggestionService', () => require('./matchesRouteTestKit').duplicateServiceMock());
jest.mock('@/services/match-duplicate.service', () => require('./matchesRouteTestKit').duplicateServiceMock());

import { describe, it, expect } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { findDuplicateMatch } from '@/services/match-duplicate.service';
import { postMatches } from './matchesRouteTestKit';

const mockPrisma = prisma as any;
const mockFindDuplicateMatch = findDuplicateMatch as jest.MockedFunction<typeof findDuplicateMatch>;

describe('POST /api/matches (characterization) — duplicatas', () => {
  it('deve detectar partida duplicada e retornar 409 (CONFLICT)', async () => {
    // Caracterização do contrato: a route lança ConflictError cujo código
    // é 'CONFLICT' (não 'DUPLICATE_MATCH' — drift histórico, corrigido no
    // client em online-match-submit.helpers.ts). O body inclui `details`
    // no formato plano { id, playerP1, playerP2 } (usado direto pelo modal
    // de partida duplicada), sem embrulhar em `details.existing`.
    mockFindDuplicateMatch.mockResolvedValue({
      id: 'dup-match',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    } as any);

    const res = await postMatches({
      player1Id: 'player-1',
      player2Id: 'player-2',
      format: 'BEST_OF_3',
      scheduledAt: new Date('2026-08-01T10:00:00Z').toISOString(),
    });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error).toBe('CONFLICT');
    expect(json.details).toBeDefined();
    expect(json.details).toEqual({ id: 'dup-match', playerP1: 'P1', playerP2: 'P2' });
  });

  it('deve permitir partida duplicada com force=true', async () => {
    mockFindDuplicateMatch.mockResolvedValue({
      id: 'dup-match',
      player1: { name: 'P1' },
      player2: { name: 'P2' },
    } as any);

    mockPrisma.match.create.mockResolvedValue({ id: 'forced-match' } as any);

    const res = await postMatches({
      player1Id: 'player-1',
      player2Id: 'player-2',
      format: 'BEST_OF_3',
      scheduledAt: new Date('2026-08-01T10:00:00Z').toISOString(),
      force: true,
    });

    expect(res.status).toBe(201);
  });
});
