/**
 * Kit de testes de scoring-protections.test.ts.
 *
 * Fora da coleta do Jest (nao termina em .test.ts) e nao limitado a 80L.
 * Concentra os helpers COM controle de fluxo que no original ficavam
 * declarados dentro dos its (assercoes 1:1 mantidas nos testes):
 * - normalizeMatchTiebreakState(): normaliza MT mal persistido (MESMA funcao
 *   duplicada nos its 6 e 7 do original);
 * - getProgress(): progresso do game (4 = vantagem, 3 = deuce, senao max);
 * - isTiebreakRegressing(): regressao de tie-break regular;
 * - isMalPersistedRegressing(): regressao de MT mal persistido (variante
 *   com isTiebreak=false nos dois lados);
 * - malformedMtState(): ScoringState mal persistido usado nos testes de
 *   normalizacao (startedAt = Date.now(), igual ao original).
 */
import type { ScoringState, SetScore } from '../types';

/** Normaliza estado de match tie-break mal persistido (games = pontos). */
export function normalizeMatchTiebreakState(scoreState: any, format: string): any {
  if (!scoreState) return scoreState;
  const isMatchTiebreakFormat = format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10';
  if (!isMatchTiebreakFormat) return scoreState;
  const result = { ...scoreState };
  if (result.sets?.length >= 1) {
    const setIndex = format === 'MATCH_TB_10' ? 0 : result.sets.length - 1;
    const set = result.sets[setIndex];
    if (set && (set.player1 > 0 || set.player2 > 0) && !set.isTiebreak && !set.tiebreakScore) {
      const newSet = {
        ...set,
        tiebreakScore: { player1: set.player1, player2: set.player2 },
        player1: 0,
        player2: 0,
        isTiebreak: true,
      };
      if (format === 'MATCH_TB_10') {
        result.sets = [newSet];
      } else {
        result.sets[setIndex] = newSet;
      }
    }
  }
  return result;
}

/** Progresso do game: 4 com vantagem, 3 em deuce, senao max(pontos). */
export function getProgress(g: any): number {
  if (g.isDeuce && g.advantage) return 4;
  if (g.isDeuce) return 3;
  return Math.max(g.player1, g.player2);
}

/** Regressao em tie-break regular (tiebreakScore dos dois lados). */
export function isTiebreakRegressing(oldSet: any, newSet: any): boolean {
  if (!oldSet || !newSet) return false;
  if (oldSet.isTiebreak && oldSet.tiebreakScore && newSet.tiebreakScore) {
    const oldTb = oldSet.tiebreakScore;
    const newTb = newSet.tiebreakScore;
    return (
      (newTb.player1 < oldTb.player1 && newTb.player2 <= oldTb.player2) ||
      (newTb.player2 < oldTb.player2 && newTb.player1 <= oldTb.player1)
    );
  }
  return false;
}

/** Regressao em match tie-break mal persistido (isTiebreak=false nos dois). */
export function isMalPersistedRegressing(oldSet: any, newSet: any): boolean {
  if (!oldSet || !newSet) return false;
  if (!oldSet.isTiebreak && !newSet.isTiebreak && oldSet.tiebreakScore) {
    if (oldSet.player1 > 0 || oldSet.player2 > 0) {
      return (
        (newSet.player1 < oldSet.player1 && newSet.player2 <= oldSet.player2) ||
        (newSet.player2 < oldSet.player2 && newSet.player1 <= oldSet.player1)
      );
    }
  }
  return false;
}

/** ScoringState mal persistido (games no lugar de pontos do MT). */
export function malformedMtState(sets: SetScore[]): ScoringState {
  return {
    sets,
    currentGame: { player1: 0, player2: 0, isDeuce: false, advantage: null, secondServe: false },
    server: 'player1',
    isFinished: false,
    winner: null,
    setsWon: { player1: 0, player2: 0 },
    startedAt: Date.now(),
    secondServe: false,
  };
}
