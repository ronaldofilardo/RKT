import type { TennisFormat } from '@/core/scoring/types';
import {
  shouldHaveTiebreak,
  getTiebreakAtForFormat,
} from '@/core/scoring/format-rules';
import { SCORING_LIMITS } from '@/lib/constants';
import type { SetEditData, SetValidation } from './edit-score-domain.types';
import { validateMatchTiebreak } from './edit-score-match-tiebreak';
import { validateStandardSet } from './edit-score-standard-set';

export type { SetEditData };
export { validateMatchTiebreakInput, isTiebreakScoreImpossible } from './edit-score-match-tiebreak';
export { getNextServerAfterSet } from './edit-score-next-server';

export function getMaxValidGames(_otherGames: number, format: TennisFormat): number {
  if (format === 'MATCH_TB_10') return SCORING_LIMITS.TIEBREAK_INPUT_CAP;
  if (!shouldHaveTiebreak(format)) return SCORING_LIMITS.TIEBREAK_INPUT_CAP;

  const tiebreakAt = getTiebreakAtForFormat(format);

  // Cap fixo (tiebreakAt + 1) permite qualquer placar válido no input.
  // Placares impossíveis (ex.: 10-8 em PRO_SET_8) são bloqueados por validateSetResult
  // com mensagem clara (Item 5 do PLANO_AJUSTAR_PLACAR).
  return tiebreakAt + 1;
}

export function validateSetResult(
  result: { p1Games: number; p2Games: number },
  format: TennisFormat,
): SetValidation {
  const { p1Games, p2Games } = result;

  if (p1Games < 0 || p2Games < 0) {
    return { isValid: false, error: 'Games cannot be negative' };
  }

  if (p1Games === 0 && p2Games === 0) {
    return { isValid: true, isPartial: true };
  }

  if (format === 'MATCH_TB_10') {
    return validateMatchTiebreak(p1Games, p2Games);
  }

  const hasTiebreak = shouldHaveTiebreak(format);
  const tiebreakAt = getTiebreakAtForFormat(format);

  const gamesNeeded = format === 'PRO_SET_8' ? 8 : 6;

  return validateStandardSet(p1Games, p2Games, gamesNeeded, true, hasTiebreak, tiebreakAt);
}
