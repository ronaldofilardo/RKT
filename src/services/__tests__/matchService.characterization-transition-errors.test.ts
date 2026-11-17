jest.mock('@/lib/prisma', () => mockPrismaModule());

import {
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
    it('deve retornar erro ao tentar transicionar para FINISHED sem scoreState', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(
        matchRow({ state: 'IN_PROGRESS', initialServerId: PLAYER_1.id }),
      );

      const result: any = await transitionMatchState('match-1', 'FINISHED', PLAYER_1.id);

      expect(result.error).toBe('CANNOT_FINISH: Partida sem pontuação registrada');
    });

    it('deve retornar erro ao tentar transicionar para FINISHED sem initialServerId', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(matchRow({ state: 'IN_PROGRESS', initialServerId: null }));

      const result: any = await transitionMatchState('match-1', 'FINISHED', undefined, {});

      expect(result.error).toBe('MATCH_NOT_STARTED: Partida sem primeiro sacador definido');
    });

    it('deve retornar null quando match não existir', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(null);
      const result = await transitionMatchState('non-existent-id', 'IN_PROGRESS', PLAYER_1.id);
      expect(result).toBeNull();
    });

    it('FIXED: TD-036 — deve BLOQUEAR transição direta de SCHEDULED para FINISHED', async () => {
      mockPrisma.match.findFirst.mockResolvedValue(
        matchRow({ state: 'SCHEDULED', initialServerId: PLAYER_1.id }),
      );
      const scoreState = {
        sets: [{ player1: 6, player2: 4 }],
        setsWon: { player1: 1, player2: 0 },
        isFinished: true,
      };

      const { ScoringEngine } = await import('@/core/scoring/engine');
      const spy = jest.spyOn(ScoringEngine, 'fromSerialized').mockReturnValue(mockFinishedEngine() as any);

      const result: any = await transitionMatchState('match-1', 'FINISHED', PLAYER_1.id, scoreState);

      expect(result).toHaveProperty('error');
      expect(result.error).toContain('INVALID_TRANSITION');
      spy.mockRestore();
    });
  });
});
