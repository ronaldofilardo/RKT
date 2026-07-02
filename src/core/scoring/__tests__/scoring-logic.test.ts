import {
  getGameScoreLabel,
  isBreakPoint,
  isGameBall,
  isSetBall,
} from '../scoring-logic';
import type { ScoringState } from '../types';

function createBaseState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: null,
    secondServe: false,
    ...overrides,
  };
}

describe('scoring-logic', () => {
  describe('getGameScoreLabel', () => {
    it('deve retornar 40xAD para player2 com advantage', () => {
      expect(getGameScoreLabel(3, 3, true, 'player2')).toBe('40xAD');
    });

    it('deve retornar ADx40 para player1 com advantage', () => {
      expect(getGameScoreLabel(3, 3, true, 'player1')).toBe('ADx40');
    });

    it('deve usar valor numérico direto quando pontos >= 4', () => {
      expect(getGameScoreLabel(4, 0)).toBe('4x0');
      expect(getGameScoreLabel(5, 3)).toBe('5x3');
    });

    it('deve formatar tiebreak como NxN', () => {
      expect(getGameScoreLabel(3, 2, false, null, true)).toBe('3x2');
      expect(getGameScoreLabel(9, 8, false, null, true)).toBe('9x8');
    });
  });

  describe('isBreakPoint', () => {
    it('deve retornar false se partida já terminou', () => {
      const state = createBaseState({ isFinished: true });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('deve retornar true quando receptor tem games iguais ao servidor (4-4)', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 4, isTiebreak: false, tiebreakScore: null }],
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(true);
    });

    it('deve retornar true quando receptor tem mais games que servidor', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 6, isTiebreak: false, tiebreakScore: null }],
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(true);
    });

    it('deve retornar false quando servidor está vencendo por 2+ games', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
        server: 'player1',
      });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('deve retornar false quando não há sets', () => {
      const state = createBaseState({ sets: [] });
      expect(isBreakPoint(state)).toBe(false);
    });

    it('deve considerar server ao calcular break point (player2 servidor)', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null }],
        server: 'player2',
      });
      expect(isBreakPoint(state)).toBe(true);
    });
  });

  describe('isGameBall', () => {
    it('deve retornar false em deuce', () => {
      const state = createBaseState({
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(false);
    });

    it('deve detectar game ball em 40-0 (3-0)', () => {
      const state = createBaseState({
        currentGame: { player1: 3, player2: 0, isDeuce: false, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('deve detectar game ball em 0-40 (0-3)', () => {
      const state = createBaseState({
        currentGame: { player1: 0, player2: 3, isDeuce: false, advantage: null, secondServe: false },
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('deve detectar game ball em tiebreak 9-8 para player1', () => {
      const state = createBaseState({
        sets: [{
          player1: 6,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 9, player2: 8 },
        }],
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('deve detectar game ball em tiebreak 8-9 para player2', () => {
      const state = createBaseState({
        sets: [{
          player1: 6,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 8, player2: 9 },
        }],
      });
      expect(isGameBall(state)).toBe(true);
    });

    it('deve retornar false em tiebreak 8-8 (não é game ball)', () => {
      const state = createBaseState({
        sets: [{
          player1: 6,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 8, player2: 8 },
        }],
      });
      expect(isGameBall(state)).toBe(false);
    });
  });

  describe('isSetBall', () => {
    it('deve retornar false se set não existe', () => {
      const state = createBaseState({ sets: [] });
      expect(isSetBall(state, 1)).toBe(false);
    });

    it('deve detectar set ball para player1 em 5-4', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 4, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(true);
    });

    it('deve detectar set ball para player2 em 4-5', () => {
      const state = createBaseState({
        sets: [{ player1: 4, player2: 5, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(true);
    });

    it('deve retornar false em 5-5 (não é set ball)', () => {
      const state = createBaseState({
        sets: [{ player1: 5, player2: 5, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(false);
    });

    it('deve detectar set ball em 6-4 para player1', () => {
      const state = createBaseState({
        sets: [{ player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null }],
      });
      expect(isSetBall(state, 1)).toBe(true);
    });
  });
});