/**
 * CHARACTERIZATION TESTS — matchValidator.ts
 * 
 * Propósito: Capturar comportamento OBSERVADO das validações de match
 * Data: 2026-07-20
 * Owner: @qa
 * 
 * Comportamentos suspeitos (resolvidos):
 * - TD-036: validateFinishMatch exige winnerId válido para reason=COMPLETED
 * - TD-036: validateTransitionState bloqueia SCHEDULED→FINISHED via ALLOWED_TRANSITIONS
 * - Score regression detection funciona corretamente em tiebreak (testes validam)
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateFinishMatch,
  validateTransitionState,
  getGameProgress,
  isCurrentGameRegressing,
  isTiebreakRegressing,
} from '../matchValidator';

describe('matchValidator (characterization)', () => {
  const baseMatch = {
    format: 'BEST_OF_3',
    player1Id: 'player-1',
    player2Id: 'player-2',
    initialServerId: 'player-1',
    scoreState: null,
    state: 'SCHEDULED' as const,
  };

  describe('validateFinishMatch', () => {
    it('deve retornar válido para partida em SCHEDULED com scoreState completo', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }, { player1: 6, player2: 4 }],
          setsWon: { player1: 2, player2: 0 },
          isFinished: true,
          winner: 'player1',
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          startedAt: null,
          secondServe: false,
        },
      };

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('deve retornar erro ALREADY_FINISHED se partida já estiver FINISHED', () => {
      const match = { ...baseMatch, state: 'FINISHED' as const };
      const result = validateFinishMatch(match, {}, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('ALREADY_FINISHED: Partida já está finalizada');
    });

    it('deve retornar erro CANNOT_FINISH_CANCELLED se partida estiver CANCELLED', () => {
      const match = { ...baseMatch, state: 'CANCELLED' as const };
      const result = validateFinishMatch(match, {}, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('CANNOT_FINISH_CANCELLED: Partida cancelada não pode ser finalizada');
    });

    it('deve retornar válido para reason=ABANDONED sem scoreState', () => {
      const match = { ...baseMatch, state: 'IN_PROGRESS' as const };
      const result = validateFinishMatch(match, undefined, 'ABANDONED');

      expect(result.valid).toBe(true);
    });

    it('deve retornar válido para reason=WALKOVER sem scoreState', () => {
      const match = { ...baseMatch, state: 'IN_PROGRESS' as const };
      const result = validateFinishMatch(match, undefined, 'WALKOVER');

      expect(result.valid).toBe(true);
    });

    it('deve retornar válido para reason=INJURY sem scoreState', () => {
      const match = { ...baseMatch, state: 'IN_PROGRESS' as const };
      const result = validateFinishMatch(match, undefined, 'INJURY');

      expect(result.valid).toBe(true);
    });

    it('deve retornar válido para reason=OUTRO sem scoreState', () => {
      const match = { ...baseMatch, state: 'IN_PROGRESS' as const };
      const result = validateFinishMatch(match, undefined, 'OUTRO');

      expect(result.valid).toBe(true);
    });

    it('deve retornar erro CANNOT_FINISH sem scoreState e sem reason especial', () => {
      const match = { ...baseMatch, state: 'IN_PROGRESS' as const };
      const result = validateFinishMatch(match, undefined, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('CANNOT_FINISH');
    });

    it('deve retornar erro MATCH_NOT_STARTED sem initialServerId', () => {
      const match = {
        ...baseMatch,
        initialServerId: null,
        state: 'IN_PROGRESS' as const,
        scoreState: { sets: [{ player1: 6, player2: 4 }] },
      };
      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('MATCH_NOT_STARTED: Partida sem primeiro sacador definido');
    });

    it('deve usar ScoringEngine.isFinished() para validar partida completa', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [
            { player1: 6, player2: 4 },
            { player1: 6, player2: 4 },
          ],
          setsWon: { player1: 2, player2: 0 },
          isFinished: true,
          winner: 'player1',
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          startedAt: null,
          secondServe: false,
        },
      };

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      expect(result.valid).toBe(true);
    });

    it('FIXED: TD-XXX — Não deve permitir finalizar sem winnerId válido', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 1, player2: 0 },
          isFinished: true,
          winner: null, // isFinished=true mas sem winner explícito
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          startedAt: null,
          secondServe: false,
        },
      };

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      // Comportamento corrigido: deve exigir winner no estado
      expect(result.valid).toBe(false);
      expect(result.error).toContain('vencedor');
    });

    it('deve permitir finalizar quando scoreState tem winner válido', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 1, player2: 0 },
          isFinished: true,
          winner: 'player1',
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          startedAt: null,
          secondServe: false,
        },
      };

      const result = validateFinishMatch(match, match.scoreState, 'COMPLETED');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTransitionState', () => {
    it('deve permitir transição SCHEDULED → IN_PROGRESS', () => {
      const result = validateTransitionState(baseMatch, 'IN_PROGRESS');
      expect(result.valid).toBe(true);
    });

    it('deve permitir transição IN_PROGRESS → FINISHED com scoreState', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }, { player1: 6, player2: 4 }],
          setsWon: { player1: 2, player2: 0 },
          isFinished: true,
          winner: 'player1',
          currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
          server: 'player1',
          startedAt: null,
          secondServe: false,
        },
      };

      const result = validateTransitionState(match, 'FINISHED', undefined, {
        allowScoreEdit: false,
      });
      expect(result.valid).toBe(true);
    });

    it('deve retornar erro ao transicionar para FINISHED sem scoreState', () => {
      const match = { ...baseMatch, state: 'IN_PROGRESS' as const };
      const result = validateTransitionState(match, 'FINISHED');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('CANNOT_FINISH: Partida sem pontuação registrada');
    });

    it('deve retornar erro ao transicionar para FINISHED sem initialServerId', () => {
      const match = {
        ...baseMatch,
        initialServerId: null,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 1, player2: 0 },
        },
      };
      const result = validateTransitionState(match, 'FINISHED', undefined, undefined, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('MATCH_NOT_STARTED: Partida sem primeiro sacador definido');
    });

    it('deve detectar score regression (setsWon diminuindo)', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 1, player2: 0 },
        },
      };

      const newScoreState = {
        sets: [{ player1: 6, player2: 4 }],
        setsWon: { player1: 0, player2: 0 }, // Regrediu de 1 para 0
      };

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });

    it('deve permitir score evolution (setsWon aumentando)', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 0, player2: 0 },
        },
      };

      const newScoreState = {
        sets: [{ player1: 6, player2: 4 }],
        setsWon: { player1: 1, player2: 0 }, // Evoluiu de 0 para 1
      };

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(true);
    });

    it('FIXED: TD-XXX — allowScoreEdit=true não deve bypassar regressão de setsWon', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 6, player2: 4 }],
          setsWon: { player1: 1, player2: 0 },
        },
      };

      const newScoreState = {
        sets: [{ player1: 6, player2: 4 }],
        setsWon: { player1: 0, player2: 0 }, // Regrediu
      };

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: true,
      });

      // Comportamento corrigido: setsWon nunca pode regredir, mesmo com allowScoreEdit
      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });

    it('deve detectar current game regression', () => {
      const match = {
        ...baseMatch,
        state: 'IN_PROGRESS' as const,
        scoreState: {
          sets: [{ player1: 3, player2: 2 }],
          setsWon: { player1: 0, player2: 0 },
          currentGame: { player1: 30, player2: 15, isDeuce: false },
        },
      };

      const newScoreState = {
        sets: [{ player1: 3, player2: 2 }],
        setsWon: { player1: 0, player2: 0 },
        currentGame: { player1: 15, player2: 15, isDeuce: false }, // Regrediu de 30 para 15
      };

      const result = validateTransitionState(match, 'IN_PROGRESS', newScoreState, {
        allowScoreEdit: false,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('SCORE_REGRESSION');
    });
  });

  describe('getGameProgress', () => {
    it('deve retornar 0 para currentGame null/undefined', () => {
      expect(getGameProgress(null, 'player1')).toBe(0);
      expect(getGameProgress(undefined, 'player1')).toBe(0);
    });

    it('deve retornar valor numérico do player no game', () => {
      const currentGame = { player1: 30, player2: 15, isDeuce: false };
      expect(getGameProgress(currentGame, 'player1')).toBe(30);
      expect(getGameProgress(currentGame, 'player2')).toBe(15);
    });

    it('deve retornar 3 para player em deuce sem advantage', () => {
      const currentGame = { player1: 40, player2: 40, isDeuce: true };
      expect(getGameProgress(currentGame, 'player1')).toBe(3);
      expect(getGameProgress(currentGame, 'player2')).toBe(3);
    });

    it('deve retornar 4 para player com advantage', () => {
      const currentGame = { player1: 40, player2: 40, isDeuce: true, advantage: 'player1' };
      expect(getGameProgress(currentGame, 'player1')).toBe(4);
      expect(getGameProgress(currentGame, 'player2')).toBe(3);
    });

    it('deve retornar 0 para player sem valor numérico', () => {
      const currentGame = { player1: '30', player2: 15, isDeuce: false } as any;
      expect(getGameProgress(currentGame, 'player1')).toBe(0);
    });
  });

  describe('isCurrentGameRegressing', () => {
    it('deve retornar false se oldCG ou newCG forem null/undefined', () => {
      expect(isCurrentGameRegressing(null, null)).toBe(false);
      expect(isCurrentGameRegressing({ player1: 30, player2: 15 }, null)).toBe(false);
      expect(isCurrentGameRegressing(null, { player1: 15, player2: 15 })).toBe(false);
    });

    it('deve retornar true se player1 regredir e player2 mantiver ou regredir', () => {
      const oldCG = { player1: 30, player2: 15, isDeuce: false };
      const newCG = { player1: 15, player2: 15, isDeuce: false };

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(true);
    });

    it('deve retornar true se player2 regredir e player1 mantiver ou regredir', () => {
      const oldCG = { player1: 30, player2: 30, isDeuce: false };
      const newCG = { player1: 30, player2: 15, isDeuce: false };

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(true);
    });

    it('deve retornar false se ambos progredirem', () => {
      const oldCG = { player1: 15, player2: 15, isDeuce: false };
      const newCG = { player1: 30, player2: 30, isDeuce: false };

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(false);
    });

    it('deve retornar false se apenas um player regredir mas o outro progredir', () => {
      const oldCG = { player1: 30, player2: 15, isDeuce: false };
      const newCG = { player1: 15, player2: 30, isDeuce: false };

      expect(isCurrentGameRegressing(oldCG, newCG)).toBe(false);
    });
  });

  describe('isTiebreakRegressing', () => {
    it('deve retornar false se oldSet ou newSet forem null/undefined', () => {
      expect(isTiebreakRegressing(null, null)).toBe(false);
      expect(isTiebreakRegressing({ player1: 6, player2: 6 }, null)).toBe(false);
    });

    it('deve retornar true se tiebreakScore regredir', () => {
      const oldSet = {
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 5, player2: 3 },
      };
      const newSet = {
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 3, player2: 3 }, // Regrediu de 5 para 3
      };

      expect(isTiebreakRegressing(oldSet, newSet)).toBe(true);
    });

    it('deve retornar false se tiebreakScore progredir', () => {
      const oldSet = {
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 3, player2: 3 },
      };
      const newSet = {
        player1: 6,
        player2: 6,
        isTiebreak: true,
        tiebreakScore: { player1: 5, player2: 3 }, // Progrediu de 3 para 5
      };

      expect(isTiebreakRegressing(oldSet, newSet)).toBe(false);
    });

  });
});