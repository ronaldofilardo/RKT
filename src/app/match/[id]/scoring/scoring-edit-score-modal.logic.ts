import type { ScoringPageDerived } from './useScoringPageDerived';

type EffectiveScoreState = NonNullable<ScoringPageDerived['effectiveScoreState']>;
type GamePointToDisplay = (points: number) => string;

/** Pontos do jogo atual para o modal de edição (tiebreak usa o último set). */
export function buildCurrentGamePoints(
  effectiveScoreState: EffectiveScoreState,
  isTiebreak: boolean,
  gamePointToDisplay: GamePointToDisplay,
): { player1: number | string; player2: number | string } {
  const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
  return {
    player1: isTiebreak
      ? (lastSet?.tiebreakScore?.player1 ?? 0)
      : gamePointToDisplay(effectiveScoreState.currentGame?.player1 ?? 0),
    player2: isTiebreak
      ? (lastSet?.tiebreakScore?.player2 ?? 0)
      : gamePointToDisplay(effectiveScoreState.currentGame?.player2 ?? 0),
  };
}

/** Tiebreak do piso (floor) para o modal de edição; null fora de tiebreak. */
export function buildFloorTiebreak(
  effectiveScoreState: EffectiveScoreState,
  isTiebreak: boolean,
): { player1: number; player2: number } | null {
  if (!isTiebreak) return null;
  const lastSet = effectiveScoreState.sets[effectiveScoreState.sets.length - 1];
  return {
    player1: lastSet?.tiebreakScore?.player1 ?? 0,
    player2: lastSet?.tiebreakScore?.player2 ?? 0,
  };
}
