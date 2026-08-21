import type { TennisFormat } from '@/core/scoring/types';
import { shouldHaveTiebreak, getTiebreakAtForFormat } from '@/core/scoring/format-rules';
import {
  gamesNeededForFormat,
  isMatchTiebreakSet,
  nextServerAfterTiebreak,
  totalGamesWithCurrentSet,
  validateMatchTiebreakPoints,
  validateMatchTiebreakScore,
  validateStandardSetRules,
  isValidTiebreakWin,
} from './editScoreHelpers.refactor.helpers';

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
  if (format === 'MATCH_TB_10') return validateMatchTiebreak(p1Games, p2Games);
  return validateStandardSet(
    p1Games,
    p2Games,
    gamesNeededForFormat(format),
    true,
    shouldHaveTiebreak(format),
    getTiebreakAtForFormat(format),
  );
}

export function validateMatchTiebreakInput(
  result: { p1Points: number; p2Points: number },
): SetValidation {
  return validateMatchTiebreakPoints(result.p1Points, result.p2Points);
}

function validateStandardSet(
  p1Games: number,
  p2Games: number,
  gamesNeeded: number,
  _withAdvantage: boolean,
  hasTiebreak: boolean,
  tiebreakAt: number,
): SetValidation {
  return validateStandardSetRules(p1Games, p2Games, gamesNeeded, hasTiebreak, tiebreakAt);
}

function validateMatchTiebreak(p1Points: number, p2Points: number): SetValidation {
  return validateMatchTiebreakScore(p1Points, p2Points);
}

export function getNextServerAfterSet(params: {
  currentServer: 'player1' | 'player2';
  p1Games: number;
  p2Games: number;
  format: TennisFormat;
  tiebreakPoints?: { player1: number; player2: number } | null;
  completedSets?: Array<{ player1: number; player2: number }>;
}): 'player1' | 'player2' {
  const {
    currentServer,
    p1Games,
    p2Games,
    format,
    tiebreakPoints = null,
    completedSets = [],
  } = params;
  const matchTiebreak = isMatchTiebreakSet(format, completedSets);
  if (matchTiebreak && tiebreakPoints) {
    return nextServerAfterTiebreak(currentServer, tiebreakPoints);
  }

  const winnerGames = Math.max(p1Games, p2Games);
  const loserGames = Math.min(p1Games, p2Games);
  const tiebreakAt = getTiebreakAtForFormat(format);
  const isTiebreakWin = winnerGames === tiebreakAt + 1 && loserGames === tiebreakAt;
  if (isTiebreakWin && (!tiebreakPoints || isValidTiebreakWin(format, winnerGames, loserGames, tiebreakPoints))) {
    return currentServer;
  }

  const totalGames = totalGamesWithCurrentSet(p1Games, p2Games, completedSets);
  return totalGames % 2 === 0
    ? currentServer
    : currentServer === 'player1' ? 'player2' : 'player1';
}
