/**
 * CHARACTERIZATION — POST /api/matches (criação).
 * Divisão da suíte original route.characterization.test.ts (452L);
 * cabeçalho completo (TD-029/TD-043/TD-044) e helpers: matchesRouteTestKit.ts.
 */
jest.mock('@/lib/prisma', () => require('./matchesRouteTestKit').prismaMock());
jest.mock('@/services/matchSuggestionService', () => require('./matchesRouteTestKit').duplicateServiceMock());
jest.mock('@/services/match-duplicate.service', () => require('./matchesRouteTestKit').duplicateServiceMock());

import { describe, it, expect } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { findDuplicateMatch } from '@/services/match-duplicate.service';
import { createdMatchFixture, matchCreateBody, postMatches } from './matchesRouteTestKit';

const mockPrisma = prisma as any;
const txMock = (mockPrisma as any).__txMock;
const mockFindDuplicateMatch = findDuplicateMatch as jest.MockedFunction<typeof findDuplicateMatch>;

describe('POST /api/matches (characterization) — criação', () => {
  it('deve criar match com dados válidos', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);
    txMock.match.create.mockResolvedValue(createdMatchFixture());

    const res = await postMatches(matchCreateBody({ sportType: 'TENNIS', visibility: 'PUBLIC' }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data).toBeDefined();
    expect(json.data.id).toBeDefined();
    expect(json.data.format).toBe('BEST_OF_3');
    expect(json.data.state).toBe('SCHEDULED');
  });

  it('deve aceitar campos opcionais (nickname, tournamentName, etc.)', async () => {
    mockFindDuplicateMatch.mockResolvedValue(null);
    // No original este teste herdava o findMany mockado pelos testes GET do
    // mesmo arquivo; array não-vazio é obrigatório para candidates.find
    // executar toTemplateAccess/canDiscoverMatchTemplate (paridade de cobertura).
    mockPrisma.match.findMany.mockResolvedValue([{ id: 'match-1', state: 'IN_PROGRESS' }]);
    txMock.match.create.mockResolvedValue(
      createdMatchFixture({ id: 'opt-match', nickname: 'Partida Amistosa', tournamentName: 'Torneio de Verão' }),
    );

    const res = await postMatches(
      matchCreateBody({
        nickname: 'Partida Amistosa',
        tournamentName: 'Torneio de Verão',
        category: 'Amador',
        round: 'Quartas de final',
        courtType: 'Saibro',
        visibility: 'PRIVATE',
        openForAnnotation: true,
        scheduledAt: new Date('2026-08-01T10:00:00Z').toISOString(),
      }),
    );
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
    txMock.match.create.mockResolvedValue(createdMatchFixture({ id: 'jwt-match' }));

    const res = await postMatches(matchCreateBody());

    expect(res.status).toBe(201);
    // SUSPECT: createdByUserId está sendo setado corretamente?
  });
});
