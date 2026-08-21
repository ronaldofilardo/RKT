import type { TennisFormat } from './types';
import {
  finalizeNormalizedState,
  hasSetsProperty,
  looksLikeMatchTiebreakFormat,
  normalizeMatchTiebreakSets,
} from './score-normalizer.helpers';

export { isMatchTiebreakSetIndex } from './score-normalizer.helpers';

/**
 * Sanea um scoreState legado/corrompido para o formato canonical.
 *
 * Bug #4 (2026-08-07): em produção, sets de Match Tiebreak eram persistidos
 * com pontos gravados em player1/player2 e SEM tiebreakScore (devido ao
 * antigo handleConfirm que descartava tiebreakScore). Esta função detecta
 * esse padrão e converte de volta para o formato canonical
 * ({ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { ... } }).
 *
 * Suporta os formatos: MATCH_TB_10, BEST_OF_3_MATCH_TB, BEST_OF_5 (5th set),
 * BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD.
 *
 * Esta é a versão unificada — substitui a implementação fragmentada em
 * src/components/dashboard/match-card-utils.ts (que não cobria BEST_OF_5).
 */
export interface NormalizedScoreState {
  sets: Array<{
    player1: number;
    player2: number;
    isTiebreak?: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
  currentGame?: {
    player1: number | string;
    player2: number | string;
    isDeuce?: boolean;
    advantage?: 'player1' | 'player2' | null;
  };
  setsWon?: { player1: number; player2: number };
  server?: 'player1' | 'player2';
}

/**
 * Determina se um índice de set em um formato dado deve ser tratado como
 * Match Tiebreak decisivo (5º set no BO5, 3º set em BO3 MT, etc.).
 * Unifica a heurística espalhada pelo código — ver docs/fix-tasks/scoring-edit-score-2026-08-07.md.
 */
function parseRawScoreState(rawScoreState: any): any | null {
  if (!rawScoreState) return null;
  let parsed = rawScoreState;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  // Snapshot serializado contém { state, history } — extrair só o state.
  if (parsed?.state && Array.isArray(parsed?.history)) {
    parsed = parsed.state;
  }
  return parsed;
}


/**
 * Sanea um scoreState para o formato canonical.
 *
 * Heurística de detecção do bug: um set com (player1 > 0 || player2 > 0),
 * sem isTiebreak e sem tiebreakScore, em formato/posição que deveria ser MT.
 * Converte: pontos vão para tiebreakScore, games voltam a 0, isTiebreak: true.
 */
export function normalizeScoreState(
  rawScoreState: any,
  format?: TennisFormat,
): NormalizedScoreState | null {
  const parsed = parseRawScoreState(rawScoreState);
  if (!parsed) return null;
  if (!hasSetsProperty(parsed)) return null;
  if (format && looksLikeMatchTiebreakFormat(format)) {
    parsed.sets = normalizeMatchTiebreakSets(parsed.sets, format);
  }
  return finalizeNormalizedState(parsed) as NormalizedScoreState | null;
}
