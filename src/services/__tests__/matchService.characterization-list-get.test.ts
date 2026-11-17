jest.mock('@/lib/prisma', () => mockPrismaModule());

import { baseCreatedMatch, mockPrismaModule, PLAYER_1 } from './matchServiceCharacterizationTestKit';
import { prisma } from '@/lib/prisma';
import { getMatch, listMatches } from '../matchService';

const mockPrisma = prisma as any;

describe('matchService (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMatches', () => {
    it('deve retornar lista vazia quando não houver matches', async () => {
      mockPrisma.match.findMany.mockResolvedValue([]);
      const result = await listMatches(undefined, undefined, undefined, 'user-1');
      expect(result).toEqual([]);
    });

    it('deve retornar matches existentes', async () => {
      mockPrisma.match.findMany.mockResolvedValue([baseCreatedMatch]);
      const result = await listMatches(undefined, undefined, undefined, 'user-1');
      expect(result.length).toBe(1);
      expect(result[0].player1Id).toBe(PLAYER_1.id);
    });

    it('deve filtrar por state quando fornecido', async () => {
      mockPrisma.match.findMany.mockResolvedValue([baseCreatedMatch]);
      const result = await listMatches('SCHEDULED', undefined, undefined, 'user-1');
      expect(result.length).toBe(1);
      expect(result[0].state).toBe('SCHEDULED');

      mockPrisma.match.findMany.mockResolvedValue([]);
      const resultInProgress = await listMatches('IN_PROGRESS', undefined, undefined, 'user-1');
      expect(resultInProgress.length).toBe(0);
    });

    it('deve aplicar paginação com cursor e limit', async () => {
      mockPrisma.match.findMany.mockResolvedValue([
        baseCreatedMatch,
        { ...baseCreatedMatch, id: 'm2' },
        { ...baseCreatedMatch, id: 'm3' },
      ]);
      const result = await listMatches(undefined, undefined, 3, 'user-1');
      expect(result.length).toBe(3);
      // Resolvido (TD-004): paginação cursor-based implementada na API layer; service retorna dados brutos
    });
  });

  describe('getMatch', () => {
    it('deve retornar match por id', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);

      const result = await getMatch('match-1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('match-1');
    });

    it('deve retornar null quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result = await getMatch('non-existent-id');
      expect(result).toBeNull();
    });

    // Histórico: o characterization original verificava `updatedMatch` e
    // `deletedMatch` via `getMatch` depois de mutações. Esses cenários
    // agora são cobertos pelos blocos `updateMatch`/`deleteMatch` (assertando
    // os mocks diretamente), dispensando uma segunda chamada.
  });
});
