import type { SetValidation } from './edit-score-domain.types';

export function validateGameBounds(
  p1Games: number,
  p2Games: number,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation | null {
  if (p1Games < 0 || p2Games < 0) {
    return { isValid: false, error: 'Games cannot be negative' };
  }

  if (p1Games === 0 && p2Games === 0) {
    return { isValid: true, isPartial: true };
  }

  if (hasTiebreak) {
    const maxValid = tiebreakAt + 1;
    if (p1Games > maxValid || p2Games > maxValid) {
      return { isValid: false, error: `Maximum ${maxValid} games in a set` };
    }
    if (p1Games === maxValid && p2Games === maxValid) {
      return {
        isValid: false,
        error: `Set score ${p1Games}x${p2Games} is not possible — tiebreak ends ${maxValid}x${tiebreakAt}`,
      };
    }
  }

  return null;
}

export function checkTiebreakThreshold(
  p1Games: number,
  p2Games: number,
  tiebreakAt: number,
): SetValidation | null {
  if (p1Games === tiebreakAt && p2Games === tiebreakAt) {
    return {
      isValid: false,
      hasTiebreak: true,
      tiebreakRequired: true,
      error: 'Tiebreak required',
    };
  }

  if (p1Games === tiebreakAt + 1 && p2Games === tiebreakAt) {
    return { isValid: true, winner: 'player1', hasTiebreak: true, tiebreakRequired: true };
  }

  if (p2Games === tiebreakAt + 1 && p1Games === tiebreakAt) {
    return { isValid: true, winner: 'player2', hasTiebreak: true, tiebreakRequired: true };
  }

  return null;
}
