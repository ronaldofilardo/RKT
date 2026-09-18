import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
import { getNextServerAfterSet } from './editScoreHelpers';
import { setsToWinForFormat, totalSetsForFormat } from '@/core/scoring/format-rules';
import { parsePointValue } from '@/core/scoring/point-utils';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/useSessionManager.utils';

export type * from './edit-score-logic.types';
import type {
  Player,
  CompletedSet,
  EditScoreState,
  EditScoreValidation,
  EditScoreMatchState,
  EditScoreMatchStateInput,
  CreateSetEditDataInput,
  ShouldAutoAddSetInput,
  CalculateNextServerInput,
} from './edit-score-logic.types';

export {
  isPotentialMTSet,
  calculateTiebreakValidation,
  calculateValidation,
} from './edit-score-validation';
import { isPotentialMTSet } from './edit-score-validation';

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

function computeSetsWon(
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

function determineMatchTiebreakStatus(
  format: TennisFormat,
  totalEditedSets: number,
  setResultsForCheck: SetEditData[],
  potentialMT: boolean,
  validation: EditScoreValidation,
): { isMatchTiebreakSet: boolean; isPotentialMTSetResult: boolean } {
  let isMatchTiebreakSet: boolean;
  if (potentialMT) {
    isMatchTiebreakSet = validation.isMatchTiebreakSet;
  } else if (setResultsForCheck.length > 0) {
    isMatchTiebreakSet = isMatchTiebreakSetUtil(totalEditedSets, setResultsForCheck, format);
  } else {
    isMatchTiebreakSet =
      format === 'MATCH_TB_10' ||
      (format === 'BEST_OF_3_MATCH_TB' && totalEditedSets === 2) ||
      (format === 'SHORT_SET_2V2_NO_AD' && totalEditedSets === 2) ||
      (format === 'BEST_OF_3_NO_AD' && totalEditedSets === 2);
  }

  const isPotentialMTSetResult = potentialMT && !isMatchTiebreakSet;
  return { isMatchTiebreakSet, isPotentialMTSetResult };
}

export function calculateMatchState(input: EditScoreMatchStateInput): EditScoreMatchState {
  const { matchFormat, completedSets, newSets, validation, currentSets } = input;
  const maxSets = totalSetsForFormat(matchFormat);
  const setsToWin = setsToWinForFormat(matchFormat);
  const totalEditedSets = completedSets.length + newSets.length;

  const setResultsForCheck = buildSetResultsForCheck(completedSets, newSets);
  const potentialMT = isPotentialMTSet(matchFormat, totalEditedSets, setResultsForCheck);

  const { isMatchTiebreakSet, isPotentialMTSetResult } = determineMatchTiebreakStatus(
    matchFormat,
    totalEditedSets,
    setResultsForCheck,
    potentialMT,
    validation,
  );

  const { p1SetsWon, p2SetsWon, p1SetsWonFromProp, p2SetsWonFromProp, newP1SetsWon, newP2SetsWon } = computeSetsWon(
    completedSets,
    newSets,
    validation,
  );

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
    isPotentialMTSet: isPotentialMTSetResult,
    maxSets,
    setsToWin,
    currentSets,
  };
}

function applyMatchTiebreakSetData(
  setData: SetEditData,
  p1Val: number,
  p2Val: number,
  matchFormat?: TennisFormat,
) {
  const baseGames = matchFormat === 'BEST_OF_5' ? 6 : 0;
  const winner: Player = p1Val > p2Val ? 'player1' : 'player2';
  setData.p1Games = winner === 'player1' ? baseGames + 1 : baseGames;
  setData.p2Games = winner === 'player2' ? baseGames + 1 : baseGames;
  setData.tiebreakScore = {
    player1: p1Val,
    player2: p2Val,
  };
}

export function createSetEditData(input: CreateSetEditDataInput): SetEditData {
  const {
    p1Val,
    p2Val,
    isSetTrulyCompleted,
    hasTiebreak,
    tiebreakP1Num,
    tiebreakP2Num,
    isMatchTiebreakSet,
    isPotentialMTSet,
    p1Points,
    p2Points,
    matchFormat,
  } = input;
  const setData: SetEditData = {
    p1Games: p1Val,
    p2Games: p2Val,
    isPartial: !isSetTrulyCompleted,
  };

  if (isMatchTiebreakSet) {
    applyMatchTiebreakSetData(setData, p1Val, p2Val, matchFormat);
  } else if (hasTiebreak && !isPotentialMTSet && tiebreakP1Num >= 0 && tiebreakP2Num >= 0) {
    setData.tiebreakScore = {
      player1: tiebreakP1Num,
      player2: tiebreakP2Num,
    };
  } else if (!isSetTrulyCompleted) {
    setData.currentGamePoints = {
      player1: parsePointValue(p1Points),
      player2: parsePointValue(p2Points),
    };
  }

  return setData;
}

export function shouldAutoAddSet(input: ShouldAutoAddSetInput): boolean {
  const { validation, matchState, currentSets, p1Val, p2Val } = input;
  if (!validation.isSetTrulyCompleted) return false;
  if (matchState.matchWouldEnd) return false;
  if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
  if (matchState.matchAlreadyOver) return false;
  if (matchState.isMatchTiebreakSet) return false;

  const scoreWasChanged = p1Val !== currentSets.player1 || p2Val !== currentSets.player2;
  if (!scoreWasChanged) return false;

  return true;
}

export function calculateNextServer(input: CalculateNextServerInput): Player {
  const { currentServer, p1Games, p2Games, matchFormat, tiebreakScore, completedSets } = input;
  const completedSetsGames = completedSets.map((cs) => ({
    player1: cs.games.player1,
    player2: cs.games.player2,
  }));
  return getNextServerAfterSet({
    currentServer,
    p1Games,
    p2Games,
    format: matchFormat,
    tiebreakPoints: tiebreakScore ?? null,
    completedSets: completedSetsGames,
  });
}