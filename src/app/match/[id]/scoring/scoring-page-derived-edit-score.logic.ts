import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import { isSetCompleted, isMatchTiebreakSetIndex } from "./scoring-domain";
import { getInitialGames } from "@/core/scoring/format-rules";
import { deriveMatchCompletedSets } from "@/core/scoring/completed-sets.logic";

export function deriveEditScoreCurrentSets(
  effectiveScoreState: ScoringState | null,
  format?: string,
): { player1: number; player2: number } {
  const defaultInitialVal = format ? getInitialGames(format as TennisFormat) : 0;

  if (!effectiveScoreState) return { player1: defaultInitialVal, player2: defaultInitialVal };

  const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
  if (!lastSet) return { player1: defaultInitialVal, player2: defaultInitialVal };

  // Se o último set já está finalizado, significa que estamos num set NOVO (que ainda não foi pro array de sets)
  if (isSetCompleted(lastSet, format as TennisFormat, effectiveScoreState.sets.length - 1, effectiveScoreState.setsWon)) {
    const isNextMtSet = isMatchTiebreakSetIndex(
      format as TennisFormat | undefined,
      effectiveScoreState.sets.length,
      effectiveScoreState.setsWon,
    );
    const initialGames = isNextMtSet ? 0 : defaultInitialVal;
    return { player1: initialGames, player2: initialGames };
  }

  if (lastSet.isTiebreak && lastSet.tiebreakScore) {
    if (lastSet.player1 > 0 || lastSet.player2 > 0) {
      return { player1: lastSet.player1, player2: lastSet.player2 };
    }
    return {
      player1: lastSet.tiebreakScore.player1,
      player2: lastSet.tiebreakScore.player2,
    };
  }

  return { player1: lastSet.player1, player2: lastSet.player2 };
}

export function deriveEditScoreCompletedSets(
  effectiveScoreState: ScoringState | null,
  format?: string,
) {
  // Delega para a função canônica (mesma regra usada no dashboard).
  return deriveMatchCompletedSets(effectiveScoreState, format).setsData.flatMap((s) =>
    s.isCompleted && s.winner
      ? [{
          games: s.games,
          winner: s.winner,
          ...(s.tiebreakScore ? { tiebreakScore: s.tiebreakScore } : {}),
        }]
      : [],
  );
}
