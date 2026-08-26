import { SCORING_LIMITS, TIEBREAK } from '@/lib/constants';
import type { TennisFormat } from '@/core/scoring/types';
import type { SetValidation } from './editScoreHelpers';

export function validateSetInputs(p1: number, p2: number, emptyMessage: string): SetValidation | null {
  if (p1 < 0 || p2 < 0) return { isValid: false, error: 'Games cannot be negative' };
  if (p1 === 0 && p2 === 0) return { isValid: false, error: emptyMessage };
  return null;
}

export function gamesNeededForFormat(format: TennisFormat): number {
  if (format === 'PRO_SET_8') return 8;
  if (format === 'SHORT_SET_2V2_NO_AD') return 4;
  return 6;
}

export function validateSetLimits(
  p1: number,
  p2: number,
  gamesNeeded: number,
  hasTiebreak: boolean,
): SetValidation | null {
  if (!hasTiebreak) return null;
  const maxValid = gamesNeeded + 1;
  return p1 > maxValid || p2 > maxValid
    ? { isValid: false, error: `Maximum ${maxValid} games in a set` }
    : null;
}

export function determineSetWinner(
  p1: number,
  p2: number,
  gamesNeeded: number,
): 'player1' | 'player2' | undefined {
  if (p1 >= gamesNeeded && p1 - p2 >= 2) return 'player1';
  if (p2 >= gamesNeeded && p2 - p1 >= 2) return 'player2';
  return undefined;
}

export function validateSetTiebreakRequirement(
  p1: number,
  p2: number,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation | null {
  return hasTiebreak && p1 === tiebreakAt && p2 === tiebreakAt
    ? { isValid: false, tiebreakRequired: true, error: 'Tiebreak required' }
    : null;
}

export function validateExtendedSetScore(
  p1: number,
  p2: number,
  gamesNeeded: number,
  winner: 'player1' | 'player2' | undefined,
): SetValidation | null {
  if (!winner) return null;
  const winnerGames = winner === 'player1' ? p1 : p2;
  const loserGames = winner === 'player1' ? p2 : p1;
  return winnerGames === gamesNeeded + 1 && loserGames < gamesNeeded - 1
    ? { isValid: false, error: 'Invalid set score' }
    : null;
}

export function buildSetValidation(
  p1: number,
  p2: number,
  winner: 'player1' | 'player2' | undefined,
  gamesNeeded: number,
  hasTiebreak: boolean,
): SetValidation {
  if (hasTiebreak && p1 === gamesNeeded + 1 && p2 === gamesNeeded) {
    return { isValid: true, winner: 'player1', hasTiebreak: true };
  }
  if (hasTiebreak && p2 === gamesNeeded + 1 && p1 === gamesNeeded) {
    return { isValid: true, winner: 'player2', hasTiebreak: true };
  }
  return winner
    ? {
        isValid: true,
        winner,
        hasTiebreak: hasTiebreak && (p1 === gamesNeeded + 1 || p2 === gamesNeeded + 1),
      }
    : { isValid: true, isPartial: true };
}

export function validateStandardSetRules(
  p1: number,
  p2: number,
  gamesNeeded: number,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation {
  const inputError = validateSetInputs(p1, p2, 'Enter the set result');
  if (inputError) return inputError;
  const limitError = validateSetLimits(p1, p2, gamesNeeded, hasTiebreak);
  if (limitError) return limitError;
  const winner = determineSetWinner(p1, p2, gamesNeeded);
  const tiebreakError = validateSetTiebreakRequirement(p1, p2, hasTiebreak, tiebreakAt);
  if (tiebreakError) return tiebreakError;
  const scoreError = validateExtendedSetScore(p1, p2, gamesNeeded, winner);
  return scoreError ?? buildSetValidation(p1, p2, winner, gamesNeeded, hasTiebreak);
}

export function validateMatchTiebreakPoints(p1: number, p2: number): SetValidation {
  const inputError = validateSetInputs(p1, p2, 'Enter the tiebreak result');
  if (inputError) return { ...inputError, error: inputError.error === 'Games cannot be negative' ? 'Points cannot be negative' : inputError.error };
  if (p1 >= TIEBREAK.MIN_WIN_POINTS_MATCH && p1 - p2 >= TIEBREAK.WIN_MARGIN) return { isValid: true, winner: 'player1' };
  if (p2 >= TIEBREAK.MIN_WIN_POINTS_MATCH && p2 - p1 >= TIEBREAK.WIN_MARGIN) return { isValid: true, winner: 'player2' };
  if (p1 > SCORING_LIMITS.MAX_TIEBREAK_POINTS_STANDARD || p2 > SCORING_LIMITS.MAX_TIEBREAK_POINTS_STANDARD) {
    return { isValid: false, error: `Maximum ${SCORING_LIMITS.MAX_TIEBREAK_POINTS_STANDARD} points in tiebreak` };
  }
  return { isValid: true, isPartial: true };
}

export function validateMatchTiebreakScore(p1: number, p2: number): SetValidation {
  const inputError = validateSetInputs(p1, p2, 'Enter the tiebreak result');
  if (inputError) return { ...inputError, error: inputError.error === 'Games cannot be negative' ? 'Points cannot be negative' : inputError.error };
  if (p1 >= TIEBREAK.MIN_WIN_POINTS_MATCH && p1 - p2 >= TIEBREAK.WIN_MARGIN) return { isValid: true, winner: 'player1' };
  if (p2 >= TIEBREAK.MIN_WIN_POINTS_MATCH && p2 - p1 >= TIEBREAK.WIN_MARGIN) return { isValid: true, winner: 'player2' };
  if (p1 > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH || p2 > SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH) {
    return { isValid: false, error: `Match Tiebreak: maximum ${SCORING_LIMITS.MAX_TIEBREAK_POINTS_MATCH} points` };
  }
  return { isValid: true, isPartial: true };
}

export function isMatchTiebreakSet(
  format: TennisFormat,
  completedSets: Array<{ player1: number; player2: number }>,
): boolean {
  if (format === 'MATCH_TB_10') return true;
  const requiredSets = format === 'BEST_OF_5' ? 4 : 2;
  const requiredWins = format === 'BEST_OF_5' ? 2 : 1;
  if (completedSets.length !== requiredSets) return false;
  const p1Wins = completedSets.filter((set) => set.player1 > set.player2).length;
  const p2Wins = completedSets.filter((set) => set.player2 > set.player1).length;
  return p1Wins === requiredWins && p2Wins === requiredWins;
}

export function nextServerAfterTiebreak(
  currentServer: 'player1' | 'player2',
  tiebreakPoints: { player1: number; player2: number } | null,
): 'player1' | 'player2' {
  if (!tiebreakPoints) return currentServer;
  const totalPoints = tiebreakPoints.player1 + tiebreakPoints.player2;
  return totalPoints % 2 === 0
    ? currentServer
    : currentServer === 'player1' ? 'player2' : 'player1';
}

export function isValidTiebreakWin(
  format: TennisFormat,
  winnerGames: number,
  loserGames: number,
  tiebreakPoints: { player1: number; player2: number } | null,
): boolean {
  if (!tiebreakPoints) return false;
  const tbWinner = Math.max(tiebreakPoints.player1, tiebreakPoints.player2);
  const tbLoser = Math.min(tiebreakPoints.player1, tiebreakPoints.player2);
  const tbMin = format === 'MATCH_TB_10' ? TIEBREAK.MIN_WIN_POINTS_MATCH : TIEBREAK.MIN_WIN_POINTS_STANDARD;
  return winnerGames > loserGames && tbWinner >= tbMin && tbWinner - tbLoser >= TIEBREAK.WIN_MARGIN;
}

export function totalGamesWithCurrentSet(
  p1Games: number,
  p2Games: number,
  completedSets: Array<{ player1: number; player2: number }>,
): number {
  return completedSets.reduce((sum, set) => sum + set.player1 + set.player2, p1Games + p2Games);
}
