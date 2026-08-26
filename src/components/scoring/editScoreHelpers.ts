import type { TennisFormat } from '@/core/scoring/types';
import {
  shouldHaveTiebreak,
  getTiebreakAtForFormat,
} from '@/core/scoring/format-rules';
import { SCORING_LIMITS, TIEBREAK } from '@/lib/constants';

export interface SetEditData {
  p1Games: number;
  p2Games: number;
  isPartial: boolean;
  tiebreakScore?: { player1: number; player2: number };
  currentGamePoints?: { player1: number | string; player2: number | string };
}

export interface SetValidation {
  isValid: boolean;
  error?: string;
  winner?: 'player1' | 'player2';
  hasTiebreak?: boolean;
  isPartial?: boolean;
  tiebreakRequired?: boolean;
}

export function isBelowFloor(
  p1: number,
  p2: number,
  floor: { player1: number; player2: number } | null,
): boolean {
  if (!floor) return false;
  return p1 < floor.player1 || p2 < floor.player2;
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
    return { isValid: false, error: 'Enter the set result' };
  }

  if (format === 'MATCH_TB_10') {
    return validateMatchTiebreak(p1Games, p2Games);
  }

  const hasTiebreak = shouldHaveTiebreak(format);
  const tiebreakAt = getTiebreakAtForFormat(format);

  const gamesNeeded = format === 'PRO_SET_8' ? 8
    : (format === 'SHORT_SET_2V2_NO_AD' ? 4 : 6);

  return validateStandardSet(p1Games, p2Games, gamesNeeded, true, hasTiebreak, tiebreakAt);
}

export function validateMatchTiebreakInput(
  result: { p1Points: number; p2Points: number },
): SetValidation {
  const { p1Points, p2Points } = result;

  if (p1Points < 0 || p2Points < 0) {
    return { isValid: false, error: 'Points cannot be negative' };
  }

  if (p1Points === 0 && p2Points === 0) {
    return { isValid: false, error: 'Enter the tiebreak result' };
  }

  // Match tiebreak: first to 10 with 2-point lead
  if (p1Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p1Points - p2Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player1' };
  }
  if (p2Points >= TIEBREAK.MIN_WIN_POINTS_MATCH && p2Points - p1Points >= TIEBREAK.WIN_MARGIN) {
    return { isValid: true, winner: 'player2' };
  }
  // Allow partial scores up to max points (flexible for edits)
  if (p1Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_STANDARD || p2Points > SCORING_LIMITS.MAX_TIEBREAK_POINTS_STANDARD) {
    return { isValid: false, error: `Maximum ${SCORING_LIMITS.MAX_TIEBREAK_POINTS_STANDARD} points in tiebreak` };
  }
  // Partial score (in progress)
  return {
    isValid: true,
    isPartial: true,
  };
}

function validateStandardSet(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  _withAdvantage: boolean,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation {
  if (p1Games < 0 || p2Games < 0) {
    return { isValid: false, error: 'Games cannot be negative' };
  }

  if (p1Games === 0 && p2Games === 0) {
    return { isValid: false, error: 'Enter the set result' };
  }

  // Over-max: in tiebreak formats, max games for a single player is gamesNeeded+1
  if (hasTiebreak) {
    const maxValid = gamesNeeded + 1;
    if (p1Games > maxValid || p2Games > maxValid) {
      return { isValid: false, error: `Maximum ${maxValid} games in a set` };
    }
  }

  let winner: 'player1' | 'player2' | undefined;

  if (p1Games >= gamesNeeded && p1Games - p2Games >= 2) {
    winner = 'player1';
  } else if (p2Games >= gamesNeeded && p2Games - p1Games >= 2) {
    winner = 'player2';
  } else if (hasTiebreak && p1Games === tiebreakAt && p2Games === tiebreakAt) {
    return {
      isValid: false,
      tiebreakRequired: true,
      error: 'Tiebreak required',
    };
  }

  // If winner has gamesNeeded+1 (7), loser must have exactly gamesNeeded-1 (5) or gamesNeeded (6)
  // Scores like 7-0, 7-1, 7-2, 7-3, 7-4 are invalid — set would have ended earlier
  if (winner && hasTiebreak) {
    const winnerGames = winner === 'player1' ? p1Games : p2Games;
    const loserGames = winner === 'player1' ? p2Games : p1Games;
    if (winnerGames === gamesNeeded + 1 && loserGames < gamesNeeded - 1) {
      return { isValid: false, error: 'Invalid set score' };
    }
  }

  if (hasTiebreak && p1Games === gamesNeeded + 1 && p2Games === gamesNeeded) {
    return { isValid: true, winner: 'player1', hasTiebreak: true };
  } else if (hasTiebreak && p2Games === gamesNeeded + 1 && p1Games === gamesNeeded) {
    return { isValid: true, winner: 'player2', hasTiebreak: true };
  }

  if (!winner) {
    const p1Reached = p1Games >= gamesNeeded;
    const p2Reached = p2Games >= gamesNeeded;
    const anyReached = p1Reached || p2Reached;
    const marginOk = Math.abs(p1Games - p2Games) >= 2;
    const reachedTooClose = anyReached && !marginOk;

    if (reachedTooClose) {
      return { isValid: true, isPartial: true };
    }

    return { isValid: true, isPartial: true };
  }

  return {
    isValid: true,
    winner,
    hasTiebreak: hasTiebreak && (p1Games === gamesNeeded + 1 || p2Games === gamesNeeded + 1),
  };
}

function validateMatchTiebreak(p1Points: number, p2Points: number): SetValidation {
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

export function getNextServerAfterSet(params: {
  currentServer: 'player1' | 'player2';
  p1Games: number;
  p2Games: number;
  format: TennisFormat;
  tiebreakPoints?: { player1: number; player2: number } | null;
  completedSets?: Array<{ player1: number; player2: number }>;
}): 'player1' | 'player2' {
  const { currentServer, p1Games, p2Games, format, tiebreakPoints, completedSets = [] } = params;

  // Check if this is a Match Tiebreak set
  const isMatchTiebreakSet = 
    format === 'MATCH_TB_10' ||
    (format === 'BEST_OF_5' && completedSets.length === 4 && 
     completedSets.filter(s => s.player1 > s.player2).length === 2 &&
     completedSets.filter(s => s.player2 > s.player1).length === 2) ||
    (format === 'BEST_OF_3_MATCH_TB' && completedSets.length === 2 &&
     completedSets.filter(s => s.player1 > s.player2).length === 1 &&
     completedSets.filter(s => s.player2 > s.player1).length === 1) ||
    ((format === 'SHORT_SET_2V2_NO_AD' || format === 'BEST_OF_3_NO_AD') && completedSets.length === 2 &&
     completedSets.filter(s => s.player1 > s.player2).length === 1 &&
     completedSets.filter(s => s.player2 > s.player1).length === 1);

  const winnerGames = Math.max(p1Games, p2Games);
  const loserGames = Math.min(p1Games, p2Games);
  const tiebreakAt = getTiebreakAtForFormat(format);

  const isTiebreakWin = winnerGames === tiebreakAt + 1 && loserGames === tiebreakAt;

  // For Match Tiebreak: server alternates every 2 points (standard tiebreak)
  // First point: currentServer serves, then alternate every 2 points
  // Total points = p1Games + p2Games (since these represent points in MT)
  if (isMatchTiebreakSet && tiebreakPoints) {
    const totalPoints = tiebreakPoints.player1 + tiebreakPoints.player2;
    // In standard tiebreak: server serves 1 point, then alternate every 2 points
    // totalPoints % 4 === 0 or 3 -> same as initial server for next point
    // totalPoints % 4 === 1 or 2 -> other player
    // But for "next server after set", we want who would serve next
    // For display purposes in edit modal, return based on total points parity
    if (totalPoints % 2 === 0) {
      return currentServer;
    }
    return currentServer === 'player1' ? 'player2' : 'player1';
  }

  if (isTiebreakWin && tiebreakPoints) {
    const tbWinner = Math.max(tiebreakPoints.player1, tiebreakPoints.player2);
    const tbLoser = Math.min(tiebreakPoints.player1, tiebreakPoints.player2);
    const tbMin = format === 'MATCH_TB_10'
      ? TIEBREAK.MIN_WIN_POINTS_MATCH
      : TIEBREAK.MIN_WIN_POINTS_STANDARD;

    if (tbWinner >= tbMin && tbWinner - tbLoser >= TIEBREAK.WIN_MARGIN) {
      return currentServer;
    }
  }

  if (isTiebreakWin) {
    return currentServer;
  }

  const totalGamesInMatch = completedSets.reduce(
    (sum, set) => sum + set.player1 + set.player2,
    p1Games + p2Games
  );

  if (totalGamesInMatch % 2 === 0) {
    return currentServer;
  }

  return currentServer === 'player1' ? 'player2' : 'player1';
}
