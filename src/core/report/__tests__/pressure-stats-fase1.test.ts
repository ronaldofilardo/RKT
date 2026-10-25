import type { TimelinePoint, ScoringState } from '@/core/scoring/types';
import {
  isGamePointForPlayer,
  isSetPointForPlayer,
  isBreakPoint,
} from '@/core/scoring/point-ball-context.logic';
import { computePressureStats } from '../pressure-shot-stats';

function createMockState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [{ player1: 0, player2: 0, isTiebreak: false }],
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null },
    server: 'player1',
    isFinished: false,
    winner: null,
    ...overrides,
  };
}

function createPoint(overrides: Partial<TimelinePoint> = {}): TimelinePoint {
  return {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'POINT',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: { player1: 0, player2: 0 },
    gamesScore: { player1: 0, player2: 0 },
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
    rallyLength: 3,
    rallyDetails: null,
    pointDetails: {} as any,
    ...overrides,
  };
}

describe('Fase 1 - Itens 1.3, 1.4 e 1.15 (Pressão: Game Points, Set Points, No-Ad)', () => {
  describe('Item 1.3: Game points e Tiebreak', () => {
    it('em deuce com vantagem, somente o jogador com vantagem tem game point', () => {
      const stateAdP1 = createMockState({
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: 'player1' },
      });
      expect(isGamePointForPlayer(stateAdP1, 'player1', 'BEST_OF_3')).toBe(true);
      expect(isGamePointForPlayer(stateAdP1, 'player2', 'BEST_OF_3')).toBe(false);

      const stateDeuce40All = createMockState({
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: null },
      });
      expect(isGamePointForPlayer(stateDeuce40All, 'player1', 'BEST_OF_3')).toBe(false);
      expect(isGamePointForPlayer(stateDeuce40All, 'player2', 'BEST_OF_3')).toBe(false);
    });

    it('em tiebreak de 7 pontos, alvo é 7 com diferença mínima de 1 (ex: 6-5)', () => {
      const stateTb7 = createMockState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 6, player2: 5 } }],
      });
      expect(isGamePointForPlayer(stateTb7, 'player1', 'BEST_OF_3')).toBe(true);
      expect(isGamePointForPlayer(stateTb7, 'player2', 'BEST_OF_3')).toBe(false);

      const stateTb7Even = createMockState({
        sets: [{ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 6, player2: 6 } }],
      });
      expect(isGamePointForPlayer(stateTb7Even, 'player1', 'BEST_OF_3')).toBe(false);
      expect(isGamePointForPlayer(stateTb7Even, 'player2', 'BEST_OF_3')).toBe(false);
    });

    it('em match tie-break (MATCH_TB_10), alvo é 10 com diferença mínima de 1 (ex: 9-8)', () => {
      const stateTb10 = createMockState({
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 9, player2: 8 } }],
      });
      expect(isGamePointForPlayer(stateTb10, 'player1', 'MATCH_TB_10')).toBe(true);
      expect(isGamePointForPlayer(stateTb10, 'player2', 'MATCH_TB_10')).toBe(false);

      const stateTb10At8 = createMockState({
        sets: [{ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { player1: 8, player2: 7 } }],
      });
      // 8-7 ainda não é ponto de jogo em tiebreak de 10
      expect(isGamePointForPlayer(stateTb10At8, 'player1', 'MATCH_TB_10')).toBe(false);
    });
  });

  describe('Item 1.15: Formato sem vantagem (No-Ad Ponto Decisivo)', () => {
    it('no 40-40 de BEST_OF_3_NO_AD, é game point para ambos e break point para o devolvedor', () => {
      const stateNoAd = createMockState({
        server: 'player1',
        currentGame: { player1: 3, player2: 3, isDeuce: true, advantage: null },
      });

      expect(isGamePointForPlayer(stateNoAd, 'player1', 'BEST_OF_3_NO_AD')).toBe(true);
      expect(isGamePointForPlayer(stateNoAd, 'player2', 'BEST_OF_3_NO_AD')).toBe(true);
      expect(isBreakPoint(stateNoAd, 'BEST_OF_3_NO_AD')).toBe(true);
    });
  });

  describe('Item 1.4: Set points dinâmicos', () => {
    it('em 5-4, 40-15 fechando em 6-4 é set point para quem tem 40', () => {
      const state = createMockState({
        sets: [{ player1: 5, player2: 4, isTiebreak: false }],
        currentGame: { player1: 3, player2: 1, isDeuce: false, advantage: null }, // 40-15
      });
      expect(isSetPointForPlayer(state, 'player1', 1, 'BEST_OF_3')).toBe(true);
      expect(isSetPointForPlayer(state, 'player2', 1, 'BEST_OF_3')).toBe(false);
    });

    it('em 5-4, 0-0 ou 15-15 NÃO é set point', () => {
      const state = createMockState({
        sets: [{ player1: 5, player2: 4, isTiebreak: false }],
        currentGame: { player1: 1, player2: 1, isDeuce: false, advantage: null }, // 15-15
      });
      expect(isSetPointForPlayer(state, 'player1', 1, 'BEST_OF_3')).toBe(false);
    });

    it('em formato SHORT_SET_2V2_NO_AD (alvo 4), 3-2 com 40-15 é set point', () => {
      const state = createMockState({
        sets: [{ player1: 3, player2: 2, isTiebreak: false }],
        currentGame: { player1: 3, player2: 1, isDeuce: false, advantage: null },
      });
      expect(isSetPointForPlayer(state, 'player1', 1, 'SHORT_SET_2V2_NO_AD')).toBe(true);
    });
  });

  describe('computePressureStats com game points e set points por jogador', () => {
    it('calcula game points específicos do jogador e não a soma indistinta', () => {
      const points: TimelinePoint[] = [
        // Ponto onde P1 tinha game point (40-15 no game 1) e venceu
        createPoint({
          gameScore: { player1: 3, player2: 1 },
          gamesScore: { player1: 0, player2: 0 },
          server: 'player1',
          winner: 'PLAYER_1',
        }),
        // Ponto onde P2 tinha game point (15-40 no game 2) e P2 venceu
        createPoint({
          gameScore: { player1: 1, player2: 3 },
          gamesScore: { player1: 1, player2: 0 },
          server: 'player1',
          winner: 'PLAYER_2',
        }),
      ];

      const p1 = computePressureStats(points, 1, 'BEST_OF_3');
      const p2 = computePressureStats(points, 2, 'BEST_OF_3');

      // P1 teve 1 game point e venceu 1 (100%)
      expect(p1.gamePointsTotal).toBe(1);
      expect(p1.gamePointsWon).toBe(1);
      expect(p1.gamePointsWonPct).toBe(100);

      // P2 teve 1 game point e venceu 1 (100%)
      expect(p2.gamePointsTotal).toBe(1);
      expect(p2.gamePointsWon).toBe(1);
      expect(p2.gamePointsWonPct).toBe(100);
    });
  });
});
