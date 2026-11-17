jest.mock('@/lib/prisma', () => mockPrismaModule());

import { baseCreatedMatch, matchRow, mockPrismaModule, PLAYER_1 } from './matchServiceCharacterizationTestKit';
import { prisma } from '@/lib/prisma';
import { finishMatch } from '../matchService';

const mockPrisma = prisma as any;

describe('matchService (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('finishMatch', () => {
    it('deve finalizar partida com reason=WALKOVER sem scoreState', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
      mockPrisma.match.update.mockResolvedValue(
        matchRow({
          state: 'FINISHED',
          finishReason: 'WALKOVER',
          finishNote: 'Adversário não compareceu',
          winnerId: PLAYER_1.id,
        }),
      );

      const result: any = await finishMatch('match-1', undefined, {
        reason: 'WALKOVER',
        winnerId: PLAYER_1.id,
        note: 'Adversário não compareceu',
      });

      expect(result).toBeDefined();
      expect(result.state).toBe('FINISHED');
      expect(result.finishReason).toBe('WALKOVER');
      expect(result.finishNote).toBe('Adversário não compareceu');
    });

    it('deve finalizar partida com reason=INJURY', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
      mockPrisma.match.update.mockResolvedValue(
        matchRow({ state: 'FINISHED', finishReason: 'INJURY', winnerId: PLAYER_1.id }),
      );

      const result: any = await finishMatch('match-1', undefined, {
        reason: 'INJURY',
        winnerId: PLAYER_1.id,
        note: 'Lesão no tornozelo',
      });

      expect(result).toBeDefined();
      expect(result.finishReason).toBe('INJURY');
    });
  });
});
