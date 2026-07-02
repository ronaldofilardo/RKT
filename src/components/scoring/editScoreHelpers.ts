import type { TennisFormat } from '@/core/scoring/types';

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

export function setsToWinForFormat(format: TennisFormat): number {
  switch (format) {
    case 'BEST_OF_5':
      return 3;
    case 'BEST_OF_3':
    case 'BEST_OF_3_MATCH_TB':
    case 'BEST_OF_3_NO_AD':
    case 'SHORT_SET_2V2_NO_AD':
      return 2;
    default:
      return 1;
  }
}

export function totalSetsForFormat(format: TennisFormat): number {
  switch (format) {
    case 'BEST_OF_5':
      return 5;
    case 'BEST_OF_3':
    case 'BEST_OF_3_MATCH_TB':
    case 'BEST_OF_3_NO_AD':
    case 'SHORT_SET_2V2_NO_AD':
      return 3;
    case 'MATCH_TB_10':
      return 1;
    default:
      return 1;
  }
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

function validateStandardSet(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  withAdvantage: boolean,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation {
  const maxGames = gamesNeeded + 5;

  if (p1Games > maxGames || p2Games > maxGames) {
    return { isValid: false, error: `Maximum ${maxGames} games per set` };
  }

  let winner: 'player1' | 'player2' | undefined;

  if (p1Games >= gamesNeeded && p1Games - p2Games >= 2) {
    winner = 'player1';
  } else if (p2Games >= gamesNeeded && p2Games - p1Games >= 2) {
    winner = 'player2';
  } else if (hasTiebreak && p1Games === gamesNeeded + 1 && p2Games === gamesNeeded) {
    winner = 'player1';
  } else if (hasTiebreak && p2Games === gamesNeeded + 1 && p1Games === gamesNeeded) {
    winner = 'player2';
  } else if (hasTiebreak && p1Games === tiebreakAt && p2Games === tiebreakAt) {
    return {
      isValid: false,
      error: `Result ${p1Games}x${p2Games} requires tiebreak (enter tiebreak score)`,
      tiebreakRequired: true,
    };
  }

  if (!winner) {
    const p1Reached = p1Games >= gamesNeeded;
    const p2Reached = p2Games >= gamesNeeded;
    const anyReached = p1Reached || p2Reached;
    const marginOk = Math.abs(p1Games - p2Games) >= 2;
    const reachedTooClose = anyReached && !marginOk;

    if (!reachedTooClose) {
      return { isValid: true, isPartial: true };
    }

    return {
      isValid: false,
      error: `Result ${p1Games}x${p2Games} is not valid. A player must win by 2 games`,
    };
  }

  return {
    isValid: true,
    winner,
    hasTiebreak: hasTiebreak && (p1Games === gamesNeeded + 1 || p2Games === gamesNeeded + 1),
  };
}

function validateMatchTiebreak(p1Points: number, p2Points: number): SetValidation {
  if (p1Points >= 10 && p1Points - p2Points >= 2) {
    return { isValid: true, winner: 'player1' };
  }
  if (p2Points >= 10 && p2Points - p1Points >= 2) {
    return { isValid: true, winner: 'player2' };
  }
  if (p1Points > 15 || p2Points > 15) {
    return { isValid: false, error: 'Match Tiebreak: maximum ~15 points' };
  }
  return {
    isValid: false,
    error: `Result ${p1Points}x${p2Points} is not valid. A player must win with 10+ points and a 2-point lead`,
  };
}

function shouldHaveTiebreak(format: TennisFormat): boolean {
  switch (format) {
    case 'SHORT_SET_2V2_NO_AD':
      return true;
    default:
      return true;
  }
}

function getTiebreakAtForFormat(format: TennisFormat): number {
  switch (format) {
    case 'SHORT_SET_2V2_NO_AD':
      return 4;
    default:
      return 6;
  }
}

export function getNextServerAfterSet(params: {
  currentServer: 'player1' | 'player2';
  p1Games: number;
  p2Games: number;
  format: TennisFormat;
  tiebreakPoints?: { player1: number; player2: number } | null;
}): 'player1' | 'player2' {
  const { currentServer, p1Games, p2Games, format, tiebreakPoints } = params;

  const winnerGames = Math.max(p1Games, p2Games);
  const loserGames = Math.min(p1Games, p2Games);
  const tiebreakAt = getTiebreakAtForFormat(format);

  const isTiebreakWin = winnerGames === tiebreakAt + 1 && loserGames === tiebreakAt;

  if (isTiebreakWin && tiebreakPoints) {
    const tbWinner = Math.max(tiebreakPoints.player1, tiebreakPoints.player2);
    const tbLoser = Math.min(tiebreakPoints.player1, tiebreakPoints.player2);
    const tbMin = format === 'MATCH_TB_10' ? 10 : 7;

    if (tbWinner >= tbMin && tbWinner - tbLoser >= 2) {
      return currentServer;
    }
  }

  if (isTiebreakWin) {
    return currentServer;
  }

  return currentServer === 'player1' ? 'player2' : 'player1';
}
