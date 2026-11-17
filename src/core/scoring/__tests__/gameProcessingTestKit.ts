/**
 * Kit de testes de game-processing.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra o arrange do arquivo original (assercoes 1:1 mantidas nos testes):
 * - createBaseState(): ScoringState vazio com overrides (sets: [] por default);
 * - createConfig(): config BEST_OF_3 com ids p1/p2 e overrides;
 * - createGame(): GameScore zerado com overrides;
 * - setScore(): placar de set em uma linha para os cenarios de onGameWon.
 */
import type { ScoringEngineConfig, ScoringState, GameScore, SetScore } from '../types';

export function createBaseState(overrides: Partial<ScoringState> = {}): ScoringState {
  return {
    sets: [],
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

export function createConfig(overrides: Partial<ScoringEngineConfig> = {}): ScoringEngineConfig {
  return {
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
    ...overrides,
  };
}

export function createGame(overrides: Partial<GameScore> = {}): GameScore {
  return { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false, ...overrides };
}

/** SetScore em uma linha (isTiebreak=false e tiebreakScore=null por default). */
export function setScore(player1: number, player2: number): SetScore {
  return { player1, player2, isTiebreak: false, tiebreakScore: null };
}
