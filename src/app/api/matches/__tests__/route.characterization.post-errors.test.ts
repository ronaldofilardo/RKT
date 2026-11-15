/**
 * CHARACTERIZATION — POST /api/matches (erros e validação).
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
const txMock = (mockPrisma as any).__txMock;
const mockFindDuplicateMatch = findDuplicateMatch as jest.MockedFunction<typeof findDuplicateMatch>;

describe('POST /api/matches (characterization) — erros e validação', () => {
  it('deve retornar 401 sem autenticação', async () => {
    const res = await postMatches(
      { player1Id: 'player-1', player2Id: 'player-2', format: 'BEST_OF_3' },
      null,
    );

    expect(res.status).toBe(401);
  });

  it('deve retornar 403 com role sem permissão play:match (ADMIN)', async () => {
    const res = await postMatches(
      { player1Id: 'user-spect', player2Id: 'player-2', format: 'BEST_OF_3' },
      'SPECTATOR',
    );

    expect(res.status).toBe(403);
  });

  it('deve retornar 400 com dados inválidos (player1Id faltando)', async () => {
    const res = await postMatches({ player2Id: 'player-2', format: 'BEST_OF_3' });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_ERROR');
  });

  it('FIXED: TD-040 — deve REJEITAR format inválido com 400', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);

    const res = await postMatches({
      player1Id: 'player-1',
      player2Id: 'player-2',
      format: 'INVALID_FORMAT',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('FIXED: TD-041 — deve REJEITAR player1 === player2 com 400', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);

    const res = await postMatches({
      player1Id: 'player-1',
      player2Id: 'player-1',
      format: 'BEST_OF_3',
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(txMock.match.create).not.toHaveBeenCalled();
  });
});
