jest.mock('@/core/scoring/engine', () => ({
  ScoringEngine: {
    fromSerialized: jest.fn(),
  },
}));

import { ScoringEngine } from '@/core/scoring/engine';
import {
  unwrapScoreState,
  isTransitionAllowed,
  validateFinishedState,
  getGameProgress,
  isCurrentGameRegressing,
  isTiebreakRegressing,
  validateScoreRegression,
  getTransitionError,
} from '../matchValidator.helpers';

const mockScoringEngine = ScoringEngine as jest.Mocked<typeof ScoringEngine>;

describe('matchValidator.helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('unwrapScoreState', () => {
    it('deve retornar null para input null/undefined', () => {
      expect(unwrapScoreState(null)).toBeNull();
      expect(unwrapScoreState(undefined)).toBeNull();
    });

    it('deve retornar null para input não-objeto', () => {
      expect(unwrapScoreState('string')).toBeNull();
      expect(unwrapScoreState(42)).toBeNull();
    });

    it('deve retornar o objeto diretamente se não tiver state/history', () => {
      const state = { setsWon: { player1: 1, player2: 0 } };
      expect(unwrapScoreState(state)).toEqual(state);
    });

    it('deve extrair state quando tiver state e history', () => {
      const inner = { setsWon: { player1: 2, player2: 0 } };
      const serialized = { state: inner, history: [] };
      expect(unwrapScoreState(serialized)).toEqual(inner);
    });
  });

  describe('isTransitionAllowed', () => {
    it('deve permitir SCHEDULED → IN_PROGRESS', () => {
      expect(isTransitionAllowed('SCHEDULED', 'IN_PROGRESS')).toBe(true);
    });

    it('deve permitir SCHEDULED → CANCELLED', () => {
      expect(isTransitionAllowed('SCHEDULED', 'CANCELLED')).toBe(true);
    });

    it('deve bloquear SCHEDULED → FINISHED', () => {
      expect(isTransitionAllowed('SCHEDULED', 'FINISHED')).toBe(false);
    });

    it('deve permitir IN_PROGRESS → FINISHED', () => {
      expect(isTransitionAllowed('IN_PROGRESS', 'FINISHED')).toBe(true);
    });

    it('deve permitir IN_PROGRESS → CANCELLED', () => {
      expect(isTransitionAllowed('IN_PROGRESS', 'CANCELLED')).toBe(true);
    });

    it('deve bloquear FINISHED → qualquer estado', () => {
      expect(isTransitionAllowed('FINISHED', 'IN_PROGRESS')).toBe(false);
      expect(isTransitionAllowed('FINISHED', 'SCHEDULED')).toBe(false);
    });

    it('deve bloquear CANCELLED → qualquer estado', () => {
      expect(isTransitionAllowed('CANCELLED', 'IN_PROGRESS')).toBe(false);
      expect(isTransitionAllowed('CANCELLED', 'SCHEDULED')).toBe(false);
    });
  });

  describe('validateFinishedState', () => {
    const baseMatch = {
      format: 'BEST_OF_3' as const,
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    };

    it('deve retornar erro quando não há scoreState', () => {
      const result = validateFinishedState({ ...baseMatch, scoreState: undefined });
      expect(result).toEqual({
        error: 'CANNOT_FINISH: Partida sem pontuação registrada',
        valid: false,
      });
    });

    it('deve retornar erro quando initialServerId é null', () => {
      const result = validateFinishedState({ ...baseMatch, initialServerId: null, scoreState: {} });
      expect(result).toEqual({
        error: 'MATCH_NOT_STARTED: Partida sem primeiro sacador definido',
        valid: false,
      });
    });

    it('deve retornar erro quando motor indica partida em andamento', () => {
      const mockEngine = { isFinished: jest.fn().mockReturnValue(false) };
      mockScoringEngine.fromSerialized.mockReturnValue(mockEngine as any);

      const result = validateFinishedState(baseMatch, { sets: [] });
      expect(result).toEqual({
        error: 'CANNOT_FINISH: Motor de pontuação indica partida em andamento',
        valid: false,
      });
    });

    it('deve retornar null quando validação passa', () => {
      const mockEngine = { isFinished: jest.fn().mockReturnValue(true) };
      mockScoringEngine.fromSerialized.mockReturnValue(mockEngine as any);

      const result = validateFinishedState(baseMatch, { sets: [] });
      expect(result).toBeNull();
    });
  });

  describe('getGameProgress', () => {
    it('deve retornar 0 para null/undefined', () => {
      expect(getGameProgress(null, 'player1')).toBe(0);
      expect(getGameProgress(undefined, 'player1')).toBe(0);
    });

    it('deve retornar valor do ponto quando não é deuce', () => {
      expect(getGameProgress({ player1: 3, player2: 1 }, 'player1')).toBe(3);
      expect(getGameProgress({ player1: 3, player2: 1 }, 'player2')).toBe(1);
    });

    it('deve retornar 4 em deuce com vantagem', () => {
      expect(getGameProgress({ isDeuce: true, advantage: 'player1' }, 'player1')).toBe(4);
    });

    it('deve retornar 3 em deuce sem vantagem para o jogador', () => {
      expect(getGameProgress({ isDeuce: true, advantage: 'player2' }, 'player1')).toBe(3);
    });

    it('deve retornar 0 quando ponto é undefined', () => {
      expect(getGameProgress({ player1: undefined, player2: 2 }, 'player1')).toBe(0);
    });
  });

  describe('isCurrentGameRegressing', () => {
    it('deve retornar false quando algum estado é null/undefined', () => {
      expect(isCurrentGameRegressing(null, { player1: 1 })).toBe(false);
      expect(isCurrentGameRegressing({ player1: 1 }, null)).toBe(false);
      expect(isCurrentGameRegressing(undefined, undefined)).toBe(false);
    });

    it('deve retornar false quando placar avança', () => {
      expect(isCurrentGameRegressing(
        { player1: 1, player2: 0 },
        { player1: 2, player2: 0 },
      )).toBe(false);
    });

    it('deve retornar true quando placar regrediu', () => {
      expect(isCurrentGameRegressing(
        { player1: 3, player2: 1 },
        { player1: 2, player2: 1 },
      )).toBe(true);
    });
  });

  describe('isTiebreakRegressing', () => {
    it('deve retornar false quando sets são undefined', () => {
      expect(isTiebreakRegressing(undefined, undefined)).toBe(false);
    });

    it('deve retornar false quando tiebreakScore avança', () => {
      expect(isTiebreakRegressing(
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 3, player2: 4 } },
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 4 } },
      )).toBe(false);
    });

    it('deve retornar true quando tiebreakScore regrediu', () => {
      expect(isTiebreakRegressing(
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 5, player2: 4 } },
        { player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 3, player2: 4 } },
      )).toBe(true);
    });
  });

  describe('validateScoreRegression', () => {
    const baseMatch = {
      format: 'BEST_OF_3' as const,
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
      scoreState: { setsWon: { player1: 1, player2: 0 } },
    };

    it('deve retornar null quando scoreState é null', () => {
      expect(validateScoreRegression(baseMatch, null, false)).toBeNull();
    });

    it('deve retornar null quando match.scoreState é null', () => {
      expect(validateScoreRegression({ ...baseMatch, scoreState: null }, {}, false)).toBeNull();
    });

    it('deve retornar erro quando setsWon regrediu', () => {
      const oldScore = { setsWon: { player1: 2, player2: 0 }, sets: [{ player1: 6, player2: 4 }] };
      const newScore = { setsWon: { player1: 1, player2: 0 }, sets: [{ player1: 6, player2: 4 }] };
      const result = validateScoreRegression(
        { ...baseMatch, scoreState: oldScore },
        newScore,
        false,
      );
      expect(result).toEqual({
        error: 'SCORE_REGRESSION: Placar não pode ser inferior ao estado atual',
        valid: false,
      });
    });

    it('deve retornar null quando allowScoreEdit é true e setsWon não regrediu', () => {
      const oldScore = { setsWon: { player1: 1, player2: 0 }, currentGame: { player1: 3, player2: 1 } };
      const newScore = { setsWon: { player1: 1, player2: 0 }, currentGame: { player1: 2, player2: 1 } };
      const result = validateScoreRegression(
        { ...baseMatch, scoreState: oldScore },
        newScore,
        true,
      );
      expect(result).toBeNull();
    });
  });

  describe('getTransitionError', () => {
    it('deve retornar null para transição permitida', () => {
      expect(getTransitionError('SCHEDULED', 'IN_PROGRESS')).toBeNull();
    });

    it('deve retornar erro para transição bloqueada', () => {
      const result = getTransitionError('SCHEDULED', 'FINISHED');
      expect(result).toEqual({
        error: 'INVALID_TRANSITION: Transição SCHEDULED → FINISHED não permitida',
        valid: false,
      });
    });
  });
});
