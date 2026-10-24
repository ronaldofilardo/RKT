import type { TennisFormat } from "@/lib/matchConfig";
import { isSetCompleted } from "@/app/match/[id]/scoring/scoring-domain";
import { isCurrentSetMatchTiebreak } from "@/components/dashboard/match-card.logic";
import type { ScoringState } from "@/core/scoring/types";
import type { FloorSets } from "./dashboard-resume.types";

export function resolveFloorSets(scoreState: ScoringState | null, format: string): FloorSets {
  if (!scoreState?.sets?.length) return null;

  // Find the current set being played (last set in array)
  const lastSet = scoreState.sets[scoreState.sets.length - 1];
  const lastSetIsCompleted = isSetCompleted(
    lastSet,
    format as TennisFormat,
    scoreState.sets.length - 1,
    scoreState.setsWon,
  );

  // Bug fix (2026-09-08): a checagem original `lastSet.isTiebreak && lastSet.tiebreakScore`
  // tratava qualquer set em tiebreak (inclusive um tiebreak comum em 6x6) como se fosse o
  // Match Tiebreak decisivo, retornando null e perdendo o floor de games (6-6) ao retomar
  // a sessão suspensa. Só o Match Tiebreak decisivo real não tem floor de games (mesmo bug
  // já corrigido em MatchCard.tsx via isCurrentSetMatchTiebreak).
  const isDecisiveMatchTiebreak = isCurrentSetMatchTiebreak(
    scoreState.sets,
    format as TennisFormat,
  );

  if (isDecisiveMatchTiebreak) {
    // Match Tiebreak decisivo: não há floor de games a aplicar.
    return null;
  }

  if (lastSet.isTiebreak && lastSet.tiebreakScore) {
    // Tiebreak comum de um set normal (ex.: 6x6) — o floor continua sendo os games do set,
    // os pontos do tiebreak em si não têm floor (começam em 0-0).
    return { player1: lastSet.player1, player2: lastSet.player2 };
  }

  return lastSetIsCompleted
    ? null
    : { player1: lastSet.player1, player2: lastSet.player2 };
}
