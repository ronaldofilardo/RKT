jest.mock('@/lib/prisma', () => mockPrismaModule());

import {
  baseCreatedMatch,
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
    it('deve criar partida com formato BEST_OF_3', async () => {
      mockPrisma.match.create.mockResolvedValue(baseCreatedMatch);

      const match = await createMatch({
        player1Id: PLAYER_1.id,
        player2Id: PLAYER_2.id,
        format: 'BEST_OF_3',
      });

      expect(match.id).toBeDefined();
      expect(match.format).toBe('BEST_OF_3');
      expect(match.state).toBe('SCHEDULED');
      expect(match.player1Id).toBe(PLAYER_1.id);
      expect(match.player2Id).toBe(PLAYER_2.id);
      expect(match.sportType).toBe('TENNIS');
      expect(match.visibility).toBe('PUBLIC');
      expect(match.openForAnnotation).toBe(false);
    });

    it('FIXED: TD-033 — deve BLOQUEAR player1 === player2 (mesmo jogador)', async () => {
      mockPrisma.match.create.mockResolvedValue({} as any);

      await expect(
        createMatch({
          player1Id: PLAYER_1.id,
          player2Id: PLAYER_1.id, // MESMO jogador
          format: 'BEST_OF_3',
        }),
      ).rejects.toThrow();

      expect(mockPrisma.match.create).not.toHaveBeenCalled();
    });

    it('deve incluir player1 e player2 no resultado', async () => {
      mockPrisma.match.create.mockResolvedValue(baseCreatedMatch);

      const match = await createMatch({
        player1Id: PLAYER_1.id,
        player2Id: PLAYER_2.id,
        format: 'BEST_OF_3',
      });

      expect(match.player1).toBeDefined();
      expect(match.player2).toBeDefined();
      expect(match.player1.name).toBe(PLAYER_1.name);
      expect(match.player2.name).toBe(PLAYER_2.name);
    });
  });
});
