import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
import {
  validateSetResult,
  validateMatchTiebreakInput,
  setsToWinForFormat,
  totalSetsForFormat,
  getNextServerAfterSet,
} from './editScoreHelpers';
import { parsePointValue } from '@/core/scoring/point-utils';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/useSessionManager.utils';

type Player = 'player1' | 'player2';

export type { Player };

export interface CompletedSet {
  games: Record<Player, number>;
  winner: Player;
}

export interface EditScoreState {
  p1Input: string;
  p2Input: string;
  p1Points: string;
  p2Points: string;
  nextServer: Player;
  tiebreakP1: string;
  tiebreakP2: string;
  newSets: SetEditData[];
}

export interface EditScoreValidation {
  bothFilled: boolean;
  p1Val: number;
  p2Val: number;
  setValidation: ReturnType<typeof validateSetResult> | null;
  hasWinner: boolean;
  completed: boolean;
  isSetTrulyCompleted: boolean;
  setValidationError: string | undefined;
  hasTiebreak: boolean;
  tiebreakComplete: boolean;
  hasValidTiebreak: boolean;
  tiebreakP1Num: number;
  tiebreakP2Num: number;
  isMatchTiebreakSet: boolean;
}

export interface EditScoreMatchState {
  p1SetsWonFromProp: number;
  p2SetsWonFromProp: number;
  newP1SetsWon: number;
  newP2SetsWon: number;
  p1SetsWon: number;
  p2SetsWon: number;
  matchAlreadyOver: boolean;
  matchWouldEnd: boolean;
  totalEditedSets: number;
  isMatchTiebreakSet: boolean;
  maxSets: number;
  setsToWin: number;
}

export const GAME_POINTS = ['0', '15', '30', '40', 'AD'] as const;

export function createInitialEditScoreState(currentServer: Player): EditScoreState {
  return {
    p1Input: '',
    p2Input: '',
    p1Points: '0',
    p2Points: '0',
    nextServer: currentServer,
    tiebreakP1: '',
    tiebreakP2: '',
    newSets: [],
  };
}

export function calculateValidation(
  p1Input: string,
  p2Input: string,
  matchFormat: TennisFormat,
  totalEditedSets: number,
): EditScoreValidation {
  const p1Val = p1Input === '' ? NaN : parseInt(p1Input, 10);
  const p2Val = p2Input === '' ? NaN : parseInt(p2Input, 10);
  const bothFilled = !isNaN(p1Val) && !isNaN(p2Val) && p1Val >= 0 && p2Val >= 0;

  // Match Tie-Break detection based on index (totalEditedSets = index of current set)
  // This is a simplified check since we don't have completed sets here
  const isMatchTiebreakSet = 
    (matchFormat === 'BEST_OF_3_MATCH_TB' && totalEditedSets === 2) ||  // 3º set
    (matchFormat === 'SHORT_SET_2V2_NO_AD' && totalEditedSets === 2) ||  // 3º set
    (matchFormat === 'BEST_OF_5' && totalEditedSets === 4) ||  // 5º set
    matchFormat === 'MATCH_TB_10';  // Único set

  const setValidation = bothFilled
    ? isMatchTiebreakSet
      ? validateMatchTiebreakInput({ p1Points: p1Val, p2Points: p2Val })
      : validateSetResult({ p1Games: p1Val, p2Games: p2Val }, matchFormat)
    : null;

  const hasWinner = setValidation?.winner !== undefined;
  const completed = hasWinner && !setValidation?.isPartial;
  const isSetTrulyCompleted = completed && !setValidation?.tiebreakRequired;
  const setValidationError = isSetTrulyCompleted ? undefined : setValidation?.error;
  const hasTiebreak = setValidation?.hasTiebreak ?? false;

  const tiebreakP1Num = parseInt(setValidation && hasTiebreak ? '' : '', 10);
  const tiebreakP2Num = parseInt(setValidation && hasTiebreak ? '' : '', 10);
  const hasValidTiebreak = false;
  const tiebreakComplete = false;

  return {
    bothFilled,
    p1Val,
    p2Val,
    setValidation,
    hasWinner,
    completed,
    isSetTrulyCompleted,
    setValidationError,
    hasTiebreak,
    tiebreakComplete,
    hasValidTiebreak,
    tiebreakP1Num,
    tiebreakP2Num,
    isMatchTiebreakSet,
  };
}

export function calculateMatchState(
  matchFormat: TennisFormat,
  completedSets: CompletedSet[],
  newSets: SetEditData[],
  validation: EditScoreValidation,
): EditScoreMatchState {
  const maxSets = totalSetsForFormat(matchFormat);
  const setsToWin = setsToWinForFormat(matchFormat);
  const totalEditedSets = completedSets.length + newSets.length;
  
  // Build setResults array for unified isMatchTiebreakSet
  const setResultsForCheck: SetEditData[] = [
    ...completedSets.map(s => ({ p1Games: s.games.player1, p2Games: s.games.player2, isPartial: false })),
    ...newSets,
  ];
  
  // Use unified isMatchTiebreakSet from useSessionManager.utils
  const isMatchTiebreakSet = isMatchTiebreakSetUtil(totalEditedSets, setResultsForCheck, matchFormat);

  const p1SetsWonFromProp = completedSets.filter((s) => s.winner === 'player1').length;
  const p2SetsWonFromProp = completedSets.filter((s) => s.winner === 'player2').length;

  const newP1SetsWon = newSets.filter((s) => s.p1Games > s.p2Games).length;
  const newP2SetsWon = newSets.filter((s) => s.p2Games > s.p1Games).length;

  const p1SetsWon =
    p1SetsWonFromProp +
    newP1SetsWon +
    (validation.isSetTrulyCompleted && validation.setValidation?.winner === 'player1' ? 1 : 0);
  const p2SetsWon =
    p2SetsWonFromProp +
    newP2SetsWon +
    (validation.isSetTrulyCompleted && validation.setValidation?.winner === 'player2' ? 1 : 0);

  const matchAlreadyOver = p1SetsWonFromProp >= setsToWin || p2SetsWonFromProp >= setsToWin;
  const matchWouldEnd = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;

  return {
    p1SetsWonFromProp,
    p2SetsWonFromProp,
    newP1SetsWon,
    newP2SetsWon,
    p1SetsWon,
    p2SetsWon,
    matchAlreadyOver,
    matchWouldEnd,
    totalEditedSets,
    isMatchTiebreakSet,
    maxSets,
    setsToWin,
  };
}

export function calculateTiebreakValidation(
  tiebreakP1: string,
  tiebreakP2: string,
  hasTiebreak: boolean,
): { hasValidTiebreak: boolean; tiebreakComplete: boolean; tiebreakP1Num: number; tiebreakP2Num: number } {
  const tiebreakP1Num = parseInt(tiebreakP1, 10);
  const tiebreakP2Num = parseInt(tiebreakP2, 10);
  const hasValidTiebreak =
    !isNaN(tiebreakP1Num) &&
    !isNaN(tiebreakP2Num) &&
    tiebreakP1Num >= 0 &&
    tiebreakP2Num >= 0;
  const tiebreakComplete =
    hasTiebreak &&
    hasValidTiebreak &&
    Math.abs(tiebreakP1Num - tiebreakP2Num) >= 2;

  return { hasValidTiebreak, tiebreakComplete, tiebreakP1Num, tiebreakP2Num };
}

export function createSetEditData(
  p1Val: number,
  p2Val: number,
  isSetTrulyCompleted: boolean,
  hasTiebreak: boolean,
  tiebreakP1Num: number,
  tiebreakP2Num: number,
  isMatchTiebreakSet: boolean,
  p1Points: string,
  p2Points: string,
  currentSets: { player1: number; player2: number },
): SetEditData {
  const setData: SetEditData = {
    p1Games: p1Val,
    p2Games: p2Val,
    isPartial: !isSetTrulyCompleted,
  };

  if (isMatchTiebreakSet) {
    setData.tiebreakScore = {
      player1: p1Val,
      player2: p2Val,
    };
  } else if (hasTiebreak && isSetTrulyCompleted) {
    setData.tiebreakScore = {
      player1: tiebreakP1Num,
      player2: tiebreakP2Num,
    };
  } else if (!isSetTrulyCompleted) {
    // Use the unified parsePointValue to correctly convert tennis scores
    // "15"->1, "30"->2, "40"->3, "AD"->4, "DEUCE"->3
    setData.currentGamePoints = {
      player1: parsePointValue(p1Points),
      player2: parsePointValue(p2Points),
    };
  }

  return setData;
}

export function shouldAutoAddSet(
  validation: EditScoreValidation,
  matchState: EditScoreMatchState,
  currentSets: { player1: number; player2: number },
  p1Val: number,
  p2Val: number,
): boolean {
  if (!validation.isSetTrulyCompleted) return false;
  if (matchState.matchWouldEnd) return false;
  if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
  if (matchState.matchAlreadyOver) return false;
  if (matchState.isMatchTiebreakSet) return false;

  const scoreWasChanged = p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
  if (!scoreWasChanged) return false;

  return true;
}

export function calculateNextServer(
  currentServer: Player,
  p1Val: number,
  p2Val: number,
  matchFormat: TennisFormat,
  tiebreakScore: { player1: number; player2: number } | null,
  completedSets: CompletedSet[],
): Player {
  const completedSetsGames = completedSets.map(cs => ({ player1: cs.games.player1, player2: cs.games.player2 }));
  return getNextServerAfterSet({
    currentServer,
    p1Games: p1Val,
    p2Games: p2Val,
    format: matchFormat,
    tiebreakPoints: tiebreakScore ?? null,
    completedSets: completedSetsGames,
  });
}

// Funções de parse foram movidas para @/core/scoring/point-utils para evitar duplicação
// Use: import { parsePointValue, toDisplayPoint, pointToProgress } from '@/core/scoring/point-utils';