import type { SetValidation } from './edit-score-domain.types';
import { validateGameBounds, checkTiebreakThreshold } from './edit-score-set-guards';

export function validateTiebreakLoserGames(
  winner: 'player1' | 'player2',
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  tiebreakAt: number,
): SetValidation | null {
  const winnerGames = winner === 'player1' ? p1Games : p2Games;
  const loserGames = winner === 'player1' ? p2Games : p1Games;

  if (winnerGames === gamesNeeded + 1 && loserGames < gamesNeeded - 1) {
    return {
      isValid: false,
      hasTiebreak: true,
      error: `Set score ${p1Games}x${p2Games} is not possible — set would have ended earlier`,
    };
  }

  if (
    tiebreakAt > gamesNeeded &&
    winnerGames === tiebreakAt + 1 &&
    loserGames !== tiebreakAt
  ) {
    return {
      isValid: false,
      hasTiebreak: true,
      error: `Set score ${p1Games}x${p2Games} is not possible — ${tiebreakAt + 1} games only from ${tiebreakAt}x${tiebreakAt} tiebreak`,
    };
  }

  return null;
}

export function resolveStandardWinner(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
): 'player1' | 'player2' | null {
  if (p1Games >= gamesNeeded && p1Games - p2Games >= 2) return 'player1';
  if (p2Games >= gamesNeeded && p2Games - p1Games >= 2) return 'player2';
  return null;
}

export function validateStandardSet(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  _withAdvantage: boolean,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation {
  const boundsValidation = validateGameBounds(p1Games, p2Games, hasTiebreak, tiebreakAt);
  if (boundsValidation) return boundsValidation;

  if (hasTiebreak) {
    const tbThreshold = checkTiebreakThreshold(p1Games, p2Games, tiebreakAt);
    if (tbThreshold) return tbThreshold;
  }

  const winner = resolveStandardWinner(p1Games, p2Games, gamesNeeded);

  if (winner && hasTiebreak) {
    const loserValidation = validateTiebreakLoserGames(winner, p1Games, p2Games, gamesNeeded, tiebreakAt);
    if (loserValidation) return loserValidation;
  }

  if (!winner) {
    return { isValid: true, isPartial: true };
  }

  return {
    isValid: true,
    winner,
    hasTiebreak: hasTiebreak && (p1Games === tiebreakAt + 1 || p2Games === tiebreakAt + 1),
  };
}
