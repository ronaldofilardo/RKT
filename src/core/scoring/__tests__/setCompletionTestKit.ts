/**
 * Kit de testes de set-completion.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra o arrange do arquivo original (assercoes 1:1 mantidas nos testes):
 * - createBaseState(): ScoringState com set 0-0 inicial (default) + overrides;
 * - createConfig(): config BEST_OF_3 com ids p1/p2 e overrides;
 * - setScore(): placar de set em uma linha (tb opcional).
 */
import type { ScoringState, ScoringEngineConfig, SetScore } from '../types';

export function createBaseState(overrides: Partial<ScoringState> = {}): ScoringState {
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

export function createConfig(overrides: Partial<ScoringEngineConfig> = {}): ScoringEngineConfig {
  return {
    format: 'BEST_OF_3',
    player1Id: 'p1',
    player2Id: 'p2',
    initialServerId: 'p1',
    ...overrides,
  };
}

/** SetScore em uma linha (isTiebreak=false e tiebreakScore=null por default). */
export function setScore(
  player1: number,
  player2: number,
  isTiebreak = false,
  tiebreakScore?: { player1: number; player2: number }
): SetScore {
  return { player1, player2, isTiebreak, tiebreakScore: tiebreakScore ?? null };
}
