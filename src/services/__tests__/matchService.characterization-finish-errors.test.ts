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
    it('deve retornar erro ALREADY_FINISHED se partida já estiver finalizada', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(matchRow({ state: 'FINISHED' }));

      const result: any = await finishMatch('match-1', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('ALREADY_FINISHED');
    });

    it('deve retornar erro CANNOT_FINISH_CANCELLED se partida estiver CANCELLED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(matchRow({ state: 'CANCELLED' }));

      const result: any = await finishMatch('match-1', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('CANNOT_FINISH_CANCELLED');
    });

    it('deve retornar erro MATCH_NOT_FOUND quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);

      const result: any = await finishMatch('non-existent-id', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('MATCH_NOT_FOUND');
    });

    it('deve retornar erro CANNOT_FINISH sem scoreState (reason=COMPLETED)', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(matchRow({ initialServerId: PLAYER_1.id }));
      const result: any = await finishMatch('match-1', {}, { reason: 'COMPLETED' });
      expect(result.error).toContain('CANNOT_FINISH');
    });

    it('deve retornar erro MATCH_NOT_STARTED sem initialServerId (reason=COMPLETED com scoreState)', async () => {
      // initialServerId permanece undefined na linha base
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);

      const result: any = await finishMatch('match-1', { sets: [] }, { reason: 'COMPLETED' });
      expect(result.error).toContain('MATCH_NOT_STARTED');
    });
  });
});
