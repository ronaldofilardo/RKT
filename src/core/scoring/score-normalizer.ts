// TODO: Remove this file after data migration window closes. It normalizes corrupted data from a historical bug (Bug #4, 2026-08-07).
import type { TennisFormat } from './types';
import type { NormalizedScoreState } from './score-normalizer.types';
import { parseRawScoreState } from './score-normalizer-history.logic';
import { looksLikeMatchTiebreakFormat, normalizeMatchTiebreakSets } from './score-normalizer-sets.logic';
import { normalizeRegularTiebreakSets, stripLegacyInitialPlaceholder } from './score-normalizer-legacy.logic';

export type { NormalizedScoreState } from './score-normalizer.types';
export { extractHistory } from './score-normalizer-history.logic';
export { isMatchTiebreakSetIndex } from './score-normalizer-sets.logic';

/**
 * Sanea um scoreState legado/corrompido para o formato canonical.
 *
 * Bug #4 (2026-08-07): em produção, sets de Match Tiebreak eram persistidos
 * com pontos gravados em player1/player2 e SEM tiebreakScore (devido ao
 * antigo confirmCurrentAction que descartava tiebreakScore). Esta função detecta
 * esse padrão e converte de volta para o formato canonical
 * ({ player1: 0, player2: 0, isTiebreak: true, tiebreakScore: { ... } }).
 *
 * Suporta os formatos: MATCH_TB_10, BEST_OF_3_MATCH_TB, BEST_OF_5 (5th set),
 * BEST_OF_3_NO_AD e SHORT_SET_2V2_NO_AD.
 *
 * Esta é a versão unificada — substitui a implementação fragmentada em
 * src/components/dashboard/match-card-utils.ts (que não cobria BEST_OF_5).
 */

function ensureDefaultCurrentGame(parsed: Record<string, unknown>): NormalizedScoreState {
  return {
    ...parsed,
    currentGame: parsed.currentGame ?? {
      player1: 0,
      player2: 0,
      isDeuce: false,
      advantage: null,
    },
  } as NormalizedScoreState;
}

/**
 * Sanea um scoreState para o formato canonical.
 *
 * Heurística de detecção do bug: um set com (player1 > 0 || player2 > 0),
 * sem isTiebreak e sem tiebreakScore, em formato/posição que deveria ser MT.
 * Converte: pontos vão para tiebreakScore, games voltam a 0, isTiebreak: true.
 */
export function normalizeScoreState(
  rawScoreState: unknown,
  format?: TennisFormat,
): NormalizedScoreState | null {
  const parsed = parseRawScoreState(rawScoreState);
  if (!parsed || !parsed.sets || !Array.isArray(parsed.sets)) return null;

  let currentSets = stripLegacyInitialPlaceholder(parsed.sets, format);

  if (format && looksLikeMatchTiebreakFormat(format)) {
    currentSets = normalizeMatchTiebreakSets(currentSets, format);
  }

  currentSets = normalizeRegularTiebreakSets(currentSets, rawScoreState);
  parsed.sets = currentSets;

  return ensureDefaultCurrentGame(parsed);
}
