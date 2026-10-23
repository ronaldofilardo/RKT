import type { SetEditData } from '@/core/scoring/edit-score-domain';
import type { Player, CompletedSet, EditScoreValidation } from '@/core/scoring/edit-score-state.types';

/**
 * Vencedor efetivo do set em edição: prefere o winner calculado pela
 * validação; em empate de games com tiebreak decidido, usa o tiebreak.
 */
export function getEffectiveSetWinner(validation: EditScoreValidation): Player | undefined {
  if (validation.setValidation?.winner) return validation.setValidation.winner;
  if (
    validation.p1Val === validation.p2Val &&
    typeof validation.tiebreakP1Num === 'number' &&
    typeof validation.tiebreakP2Num === 'number' &&
    validation.tiebreakP1Num !== validation.tiebreakP2Num
  ) {
    return validation.tiebreakP1Num > validation.tiebreakP2Num ? 'player1' : 'player2';
  }
  return undefined;
}

function buildSetResultsForCheck(
  completedSets: CompletedSet[],
  newSets: SetEditData[],
): SetEditData[] {
  return [
    ...completedSets.map((s) => ({
      p1Games: s.games.player1,
      p2Games: s.games.player2,
      isPartial: false,
    })),
    ...newSets,
  ];
}

function countNewSetsWon(newSets: SetEditData[]): { newP1SetsWon: number; newP2SetsWon: number } {
  const newP1SetsWon = newSets.filter((s) => {
    if (s.isPartial) return false;
    if (s.tiebreakScore) {
      return s.tiebreakScore.player1 > s.tiebreakScore.player2;
    }
    return s.p1Games > s.p2Games;
  }).length;
  const newP2SetsWon = newSets.filter((s) => {
    if (s.isPartial) return false;
    if (s.tiebreakScore) {
      return s.tiebreakScore.player2 > s.tiebreakScore.player1;
    }
    return s.p2Games > s.p1Games;
  }).length;
  return { newP1SetsWon, newP2SetsWon };
}

export function computeSetsWon(
  completedSets: CompletedSet[],
  newSets: SetEditData[],
  validation: EditScoreValidation,
): {
  p1SetsWon: number;
  p2SetsWon: number;
  p1SetsWonFromProp: number;
  p2SetsWonFromProp: number;
  newP1SetsWon: number;
  newP2SetsWon: number;
} {
  const p1SetsWonFromProp = completedSets.filter((s) => s.winner === 'player1').length;
  const p2SetsWonFromProp = completedSets.filter((s) => s.winner === 'player2').length;
  const { newP1SetsWon, newP2SetsWon } = countNewSetsWon(newSets);

  const currentSetWinner = getEffectiveSetWinner(validation);
  const p1SetsWon =
    p1SetsWonFromProp +
    newP1SetsWon +
    (validation.isSetTrulyCompleted && currentSetWinner === 'player1' ? 1 : 0);
  const p2SetsWon =
    p2SetsWonFromProp +
    newP2SetsWon +
    (validation.isSetTrulyCompleted && currentSetWinner === 'player2' ? 1 : 0);

  return {
    p1SetsWon,
    p2SetsWon,
    p1SetsWonFromProp,
    p2SetsWonFromProp,
    newP1SetsWon,
    newP2SetsWon,
  };
}

export { buildSetResultsForCheck };
