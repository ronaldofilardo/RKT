/**
 * Kit de testes de scoring-logic.characterization.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra o arrange do arquivo original (assercoes 1:1 mantidas nos testes):
 * - createBaseState(): ScoringState com set 0-0 inicial (default) + overrides;
 * - createPointLog()/createHistoryEntry(): fixtures de ponto e histórico;
 * - setScore(): placar de set em uma linha (tb opcional);
 * - game(): GameScore com pontos e overrides de deuce/vantagem.
 */
import type { ScoringState, HistoryEntry, PointLog, GameScore, SetScore } from '../types';

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

export function createPointLog(overrides: Partial<PointLog> = {}): PointLog {
  return {
    id: `pt-${Date.now()}`,
    matchId: 'm1',
    pointNumber: 1,
    winnerId: 'p1',
    type: 'RALLY',
    isFirstServe: true,
    isSecondServe: false,
    server: 'player1',
    rallyLength: 4,
    rallyDetails: { situacao: 'rally', tipo: 'forehand', subtipo1: 'crosscourt' },
    firstFaultDetail: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createHistoryEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    stateBefore: createBaseState(),
    point: createPointLog(),
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

/** GameScore com `player1`/`player2` pontos e overrides de deuce/vantagem. */
export function game(player1: number, player2: number, overrides: Partial<GameScore> = {}): GameScore {
  return { player1, player2, isDeuce: false, advantage: null, secondServe: false, ...overrides };
}
