import { isMatchTiebreakSet } from "@/core/scoring/match-tiebreak-logic";

/** Forma mínima de set que esta normalização manipula. */
interface TiebreakNormalizableSet {
  player1: number;
  player2: number;
  isTiebreak?: boolean;
  tiebreakScore?: { player1: number; player2: number } | null;
}

/** Forma mínima de estado que esta normalização manipula (snapshot/bank). */
interface TiebreakNormalizableState {
  sets?: TiebreakNormalizableSet[];
}

function isMatchTiebreakFormatType(format: string): boolean {
  return format === 'BEST_OF_3_MATCH_TB' || format === 'MATCH_TB_10' ||
         format === 'BEST_OF_5' || format === 'SHORT_SET_2V2_NO_AD' ||
         format === 'BEST_OF_3_NO_AD';
}

export function normalizeMatchTiebreakState(
  scoreState: TiebreakNormalizableState | null | undefined,
  format: string,
): TiebreakNormalizableState | null | undefined {
  if (!scoreState) return scoreState;

  const isMatchTiebreakFormat = isMatchTiebreakFormatType(format);
  if (!isMatchTiebreakFormat) return scoreState;

  const result: TiebreakNormalizableState = { ...scoreState };

  const sets = result.sets;
  if (sets && sets.length >= 1) {
    const setIndex = format === 'MATCH_TB_10' ? 0 : sets.length - 1;
    const set = sets[setIndex];

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
        sets[setIndex] = newSet;
      }
    }
  }

  return result;
}

export { isMatchTiebreakSet };
