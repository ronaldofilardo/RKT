jest.mock('@/lib/prisma', () => mockPrismaModule());

import {
  baseCreatedMatch,
  matchRow,
  mockFinishedEngine,
  mockPrismaModule,
  PLAYER_1,
} from './matchServiceCharacterizationTestKit';
import { prisma } from '@/lib/prisma';
import { transitionMatchState } from '../matchService';

const mockPrisma = prisma as any;

describe('matchService (characterization)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transitionMatchState', () => {
    it('deve transicionar de SCHEDULED para IN_PROGRESS', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(baseCreatedMatch);
      mockPrisma.match.update.mockResolvedValue(
        matchRow({ state: 'IN_PROGRESS', startedAt: new Date(), initialServerId: PLAYER_1.id }),
      );

      const result: any = await transitionMatchState('match-1', 'IN_PROGRESS', PLAYER_1.id);

      expect(result).toBeDefined();
      expect(result.state).toBe('IN_PROGRESS');
      expect(result.startedAt).toBeInstanceOf(Date);
      expect(result.initialServerId).toBe(PLAYER_1.id);
    });

    it('deve transicionar de IN_PROGRESS para FINISHED com scoreState', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(
        matchRow({ state: 'IN_PROGRESS', initialServerId: PLAYER_1.id }),
      );
      const scoreState = { setsWon: { player1: 1, player2: 0 }, isFinished: true };
      mockPrisma.match.update.mockResolvedValue(
        matchRow({ state: 'FINISHED', finishedAt: new Date(), scoreState }),
      );

      // Mock ScoringEngine via matchValidator's import. matchValidator cria
      // engine via `ScoringEngine.fromSerialized(...)`. Para evitar a
      // construção real (que precisa de scoreState válido), mockamos por
      // spy. Fazê-lo aqui é seguro — este teste characteriza a transição,
      // não a validação do motor (coberta em matchValidator.characterization).
      const { ScoringEngine } = await import('@/core/scoring/engine');
      const spy = jest.spyOn(ScoringEngine, 'fromSerialized').mockReturnValue(mockFinishedEngine() as any);

      const result: any = await transitionMatchState('match-1', 'FINISHED', PLAYER_1.id, scoreState);

      expect(result).toBeDefined();
      expect(result.state).toBe('FINISHED');
      expect(result.finishedAt).toBeInstanceOf(Date);
      expect(result.scoreState).toEqual(scoreState);
      spy.mockRestore();
    });
  });
});
