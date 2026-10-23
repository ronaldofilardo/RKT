import { SCORING_LIMITS, TIEBREAK } from '@/lib/constants';
import type { SetValidation } from './edit-score-domain.types';

export function validateMatchTiebreakInput(
  result: { p1Points: number; p2Points: number },
): SetValidation {
  const { p1Points, p2Points } = result;

  if (p1Points < 0 || p2Points < 0) {
    return { isValid: false, error: 'Points cannot be negative' };
  }

  if (p1Points === 0 && p2Points === 0) {
    return { isValid: true, isPartial: true };
  }

  // Match tiebreak: first to 10 with 2-point lead
  if (p1Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p1Points - p2Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player1' };
  }
  if (p2Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p2Points - p1Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player2' };
  }
  // Allow partial scores up to max points (flexible for edits)
  if (p1Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH || p2Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH) {
    return { isValid: false, error: `Maximum ${SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH} points in match tiebreak` };
  }
  // Partial score (in progress)
  return {
    isValid: true,
    isPartial: true,
  };
}

export function validateMatchTiebreak(p1Points: number, p2Points: number): SetValidation {
  if (p1Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p1Points - p2Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player1' };
  }
  if (p2Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p2Points - p1Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player2' };
  }
  if (p1Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH || p2Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH) {
    return { isValid: false, error: `Match Tiebreak: maximum ${SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH} points` };
  }
  return {
    isValid: true,
    isPartial: true,
  };
}

export function isTiebreakScoreImpossible(p1: number, p2: number): boolean {
  if (p1 < 0 || p2 < 0) return false;
  if (p1 === p2) return false;

  const winner = Math.max(p1, p2);
  const loser = Math.min(p1, p2);

  if (loser < 6 && winner > 7) return true;
  if (loser >= 6 && winner > loser + 2) return true;

  return false;
}
