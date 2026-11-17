jest.mock('@/lib/prisma', () => mockPrismaModule());

import {
  baseCreatedMatch,
  fullCreateInput,
  fullCreatedMatch,
  mockPrismaModule,
  PLAYER_1,
  PLAYER_2,
} from './matchServiceCharacterizationTestKit';
import { prisma } from '@/lib/prisma';
import { createMatch } from '../matchService';

const mockPrisma = prisma as any;

describe('matchService (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMatch', () => {
    it('deve criar partida com todos os campos opcionais', async () => {
      mockPrisma.match.create.mockResolvedValue(fullCreatedMatch());

      const match = await createMatch(fullCreateInput());

      expect(match.courtType).toBe('Saibro');
      expect(match.nickname).toBe('Partida Amistosa');
      expect(match.visibility).toBe('PRIVATE');
      expect(match.openForAnnotation).toBe(true);
      expect(match.tournamentName).toBe('Torneio de Verão');
    });

    it('deve setar createdByUserId quando fornecido', async () => {
      const createdMatch = { ...baseCreatedMatch, createdByUserId: 'user-123' };
      mockPrisma.match.create.mockResolvedValue(createdMatch);

      const match = await createMatch(
        {
          player1Id: PLAYER_1.id,
          player2Id: PLAYER_2.id,
          format: 'BEST_OF_3',
        },
        'user-123',
      );

      // SUSPECT: createdByUserId está sendo setado?
      // Caracterização: o service passa createdByUserId para o Prisma
      // quando fornecido (ver matchService.ts:55); o teste apenas valida
      // que chamou create com o campo no payload.
      expect(match).toBeDefined();
      expect(mockPrisma.match.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdByUserId: 'user-123' }),
        }),
      );
    });
  });
});
