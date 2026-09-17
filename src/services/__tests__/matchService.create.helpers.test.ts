jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { logger } from '@/lib/logger';
import {
  validateCreateMatchPlayers,
  warnMissingCreator,
  buildCreateMatchData,
} from '../matchService.create.helpers';
import { ValidationError } from '@/lib/errors';

describe('matchService.create.helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreateMatchPlayers', () => {
    it('deve lancar ValidationError quando player1Id === player2Id', () => {
      expect(() =>
        validateCreateMatchPlayers({
          player1Id: 'p1',
          player2Id: 'p1',
          format: 'BEST_OF_3',
        } as any)
      ).toThrow(ValidationError);
    });

    it('deve lancar erro com mensagem sobre jogador duplicado', () => {
      try {
        validateCreateMatchPlayers({
          player1Id: 'p1',
          player2Id: 'p1',
          format: 'BEST_OF_3',
        } as any);
        fail('Deveria ter lancado erro');
      } catch (e: any) {
        expect(e.details).toEqual({
          player2Id: ['Jogador 2 deve ser diferente do Jogador 1'],
        });
      }
    });

    it('deve passar quando player1Id !== player2Id', () => {
      expect(() =>
        validateCreateMatchPlayers({
          player1Id: 'p1',
          player2Id: 'p2',
          format: 'BEST_OF_3',
        } as any)
      ).not.toThrow();
    });
  });

  describe('warnMissingCreator', () => {
    it('deve emitir warn quando createdByUserId é undefined', () => {
      warnMissingCreator(undefined);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('createdByUserId ausente')
      );
    });

    it('deve emitir warn quando createdByUserId é vazio', () => {
      warnMissingCreator('');
      expect(logger.warn).toHaveBeenCalled();
    });

    it('nao deve emitir warn quando createdByUserId é fornecido', () => {
      warnMissingCreator('user-1');
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('buildCreateMatchData', () => {
    const baseData = {
      player1Id: 'p1',
      player2Id: 'p2',
      format: 'BEST_OF_3' as const,
      sportType: 'TENNIS',
    };

    it('deve criar dados com defaults corretos', () => {
      const result = buildCreateMatchData(baseData as any);

      expect(result).toEqual(
        expect.objectContaining({
          player1Id: 'p1',
          player2Id: 'p2',
          format: 'BEST_OF_3',
          sportType: 'TENNIS',
          state: 'SCHEDULED',
          courtType: null,
          nickname: null,
          visibility: 'PUBLIC',
          openForAnnotation: false,
          tournamentName: null,
          category: null,
          round: null,
          bracketType: null,
          temperature: null,
          humidity: null,
          scheduledAt: null,
        })
      );
    });

    it('deve incluir initialServerId quando fornecido', () => {
      const result = buildCreateMatchData({
        ...baseData,
        initialServerId: 'p1',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({ initialServerId: 'p1' })
      );
    });

    it('deve incluir createdByUserId quando fornecido', () => {
      const result = buildCreateMatchData(baseData as any, 'user-1');

      expect(result).toEqual(
        expect.objectContaining({ createdByUserId: 'user-1' })
      );
    });

    it('nao deve incluir createdByUserId quando não fornecido', () => {
      const result = buildCreateMatchData(baseData as any);

      expect(result).not.toHaveProperty('createdByUserId');
    });

    it('deve usar roundName como fallback para round', () => {
      const result = buildCreateMatchData({
        ...baseData,
        roundName: 'Quarterfinal',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({ round: 'Quarterfinal' })
      );
    });

    it('deve usar valores fornecidos para campos opcionais', () => {
      const result = buildCreateMatchData({
        ...baseData,
        sportType: 'PADDEL',
        courtType: 'CLAY',
        nickname: 'Teste',
        visibility: 'PRIVATE',
        openForAnnotation: true,
        tournamentName: 'Open',
        category: 'A',
        round: 'Final',
        bracketType: 'SINGLE',
        temperature: 25,
        humidity: 60,
        scheduledAt: '2026-08-01T10:00:00Z',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          sportType: 'PADDEL',
          courtType: 'CLAY',
          nickname: 'Teste',
          visibility: 'PRIVATE',
          openForAnnotation: true,
          tournamentName: 'Open',
          category: 'A',
          round: 'Final',
          bracketType: 'SINGLE',
          temperature: 25,
          humidity: 60,
          scheduledAt: '2026-08-01T10:00:00Z',
        })
      );
    });
  });
});
