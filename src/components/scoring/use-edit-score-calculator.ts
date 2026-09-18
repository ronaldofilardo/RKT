import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type {
  CompletedSet,
  EditScoreState,
  EditScoreValidation,
  EditScoreMatchState,
} from './edit-score-logic';
import {
  calculateValidation,
  calculateMatchState,
  calculateTiebreakValidation,
} from './edit-score-logic';
import type { SetEditData } from './editScoreHelpers';

export interface UseEditScoreCalculatorParams {
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  editableCompletedSets?: SetEditData[];
  state: EditScoreState;
  tiebreakP1: string;
  tiebreakP2: string;
  currentSets?: { player1: number; player2: number };
}

export interface EditScoreCalculations {
  validation: EditScoreValidation;
  tiebreakValidation: {
    hasValidTiebreak: boolean;
    tiebreakComplete: boolean;
    tiebreakImpossible: boolean;
    tiebreakP1Num: number;
    tiebreakP2Num: number;
  };
  matchState: EditScoreMatchState;
  canAddNextSet: boolean;
  canConfirmSet: boolean;
  canConfirm: boolean;
  partial: boolean;
  showGamePointsAtZero: boolean;
  isPotentialMTSet: boolean;
  currentScoreBelowOriginal: boolean;
}

export function evaluateCanAddNextSet(
  validation: EditScoreValidation,
  matchState: EditScoreMatchState,
  tiebreakValidation: { tiebreakComplete: boolean },
): boolean {
  if (!validation.isSetTrulyCompleted) return false;
  if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
  if (matchState.matchAlreadyOver || matchState.matchWouldEnd) return false;
  if (matchState.isMatchTiebreakSet) return false;
  if (validation.hasTiebreak && !tiebreakValidation.tiebreakComplete) return false;
  return true;
}

export function evaluateCanConfirmSet(
  validation: EditScoreValidation,
  tiebreakValidation: { tiebreakImpossible: boolean; hasValidTiebreak: boolean },
  matchState: EditScoreMatchState,
): boolean {
  if (!validation.bothFilled || tiebreakValidation.tiebreakImpossible) return false;

  if (matchState.isMatchTiebreakSet) {
    return !validation.setValidationError || validation.isSetTrulyCompleted;
  }

  if (!validation.isSetTrulyCompleted) return false;

  const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;
  if (validation.hasTiebreak && tiebreakRequired && !tiebreakValidation.hasValidTiebreak) {
    return false;
  }

  return true;
}

function checkUnfilledAllowed(
  bothFilled: boolean,
  hasNewSets: boolean,
  hasCompletedSets: boolean,
): boolean | null {
  if (!bothFilled) {
    return hasNewSets || hasCompletedSets;
  }
  return null;
}

function checkZeroScoreAllowed(
  p1Val: number,
  p2Val: number,
  hasNewSets: boolean,
  hasCompletedSets: boolean,
  hasGamePoints: boolean,
): boolean {
  const scoresAreZero = p1Val === 0 && p2Val === 0;
  if (!scoresAreZero) return false;
  if (hasCompletedSets || hasNewSets) return true;
  return hasGamePoints;
}

function checkZeroOrEmptyAllowed(
  bothFilled: boolean,
  p1Val: number,
  p2Val: number,
  hasNewSets: boolean,
  hasCompletedSets: boolean,
  hasGamePoints: boolean,
): boolean | null {
  const unfilledResult = checkUnfilledAllowed(bothFilled, hasNewSets, hasCompletedSets);
  if (unfilledResult !== null) return unfilledResult;
  if (checkZeroScoreAllowed(p1Val, p2Val, hasNewSets, hasCompletedSets, hasGamePoints)) {
    return true;
  }
  return null;
}

function checkScoreBoundsAndTiebreak(
  p1Val: number,
  p2Val: number,
  currentSets: { player1: number; player2: number } | undefined,
  tiebreakImpossible: boolean,
): boolean {
  if (currentSets && (p1Val < currentSets.player1 || p2Val < currentSets.player2)) {
    return false;
  }
  if (tiebreakImpossible) {
    return false;
  }
  return true;
}

function checkSetErrorValidity(
  isMatchTiebreakSet: boolean,
  setValidationError: string | undefined,
  isSetTrulyCompleted: boolean,
  tiebreakRequired: boolean,
): boolean {
  if (isMatchTiebreakSet) {
    return !setValidationError || isSetTrulyCompleted;
  }
  if (setValidationError && !tiebreakRequired) {
    return false;
  }
  return true;
}

export function evaluateCanConfirm(params: {
  validation: EditScoreValidation;
  matchState: EditScoreMatchState;
  newSetsCount: number;
  p1Points: string;
  p2Points: string;
  completedSetsCount: number;
  tiebreakImpossible: boolean;
}): boolean {
  const { validation, matchState, newSetsCount, p1Points, p2Points, completedSetsCount, tiebreakImpossible } = params;
  const hasNewSets = newSetsCount > 0;
  const hasCompletedSets = completedSetsCount > 0;
  const hasGamePoints = p1Points !== "0" || p2Points !== "0";

  const emptyOrZeroResult = checkZeroOrEmptyAllowed(
    validation.bothFilled,
    validation.p1Val,
    validation.p2Val,
    hasNewSets,
    hasCompletedSets,
    hasGamePoints,
  );
  if (emptyOrZeroResult !== null) return emptyOrZeroResult;

  if (!checkScoreBoundsAndTiebreak(validation.p1Val, validation.p2Val, matchState.currentSets, tiebreakImpossible)) {
    return false;
  }

  const isMatchTiebreakSet = matchState.isMatchTiebreakSet;
  const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;
  return checkSetErrorValidity(
    isMatchTiebreakSet,
    validation.setValidationError,
    validation.isSetTrulyCompleted,
    tiebreakRequired,
  );
}

export function evaluateShowGamePointsAtZero(
  validation: EditScoreValidation,
  completedSetsCount: number,
  newSets: SetEditData[],
): boolean {
  const hasPreviousSets = completedSetsCount > 0 || newSets.length > 0 || validation.isSetTrulyCompleted;
  const isAtZero =
    !validation.bothFilled ||
    (validation.p1Val === 0 && validation.p2Val === 0) ||
    validation.isSetTrulyCompleted;
  const prevSetCompleted = newSets.length > 0
    ? newSets[newSets.length - 1].isPartial === false
    : completedSetsCount > 0 || validation.isSetTrulyCompleted;
  return hasPreviousSets && isAtZero && prevSetCompleted;
}

export function useEditScoreCalculator({
  matchFormat,
  completedSets,
  editableCompletedSets,
  state,
  tiebreakP1,
  tiebreakP2,
  currentSets,
}: UseEditScoreCalculatorParams): EditScoreCalculations {
  const effectiveCompletedCount = editableCompletedSets?.length ?? completedSets.length;

  const validation = useMemo(() => {
    const setResults: SetEditData[] = [
      ...completedSets.map((cs) => ({ p1Games: cs.games.player1, p2Games: cs.games.player2, isPartial: false })),
      ...state.newSets,
    ];
    return calculateValidation({
      p1Input: state.p1Input,
      p2Input: state.p2Input,
      matchFormat,
      totalEditedSets: state.newSets.length + effectiveCompletedCount,
      setResults,
      tiebreakP1,
      tiebreakP2,
    });
  }, [state.p1Input, state.p2Input, matchFormat, state.newSets, effectiveCompletedCount, completedSets, tiebreakP1, tiebreakP2]);

  const tiebreakValidation = useMemo(
    () => calculateTiebreakValidation(tiebreakP1, tiebreakP2, validation.hasTiebreak || !!validation.setValidation?.tiebreakRequired),
    [tiebreakP1, tiebreakP2, validation.hasTiebreak, validation.setValidation],
  );

  const matchState = useMemo(() => calculateMatchState({
    matchFormat,
    completedSets,
    newSets: state.newSets,
    validation,
    totalEditedSets: state.newSets.length + effectiveCompletedCount,
    currentSets,
  }), [matchFormat, completedSets, state.newSets, validation, effectiveCompletedCount, currentSets]);

  const canAddNextSet = useMemo(
    () => evaluateCanAddNextSet(validation, matchState, tiebreakValidation),
    [validation, matchState, tiebreakValidation],
  );

  const canConfirmSet = useMemo(
    () => evaluateCanConfirmSet(validation, tiebreakValidation, matchState),
    [validation, tiebreakValidation, matchState],
  );

  const canConfirm = useMemo(
    () => evaluateCanConfirm({
      validation,
      matchState,
      newSetsCount: state.newSets.length,
      p1Points: state.p1Points,
      p2Points: state.p2Points,
      completedSetsCount: completedSets.length,
      tiebreakImpossible: tiebreakValidation.tiebreakImpossible,
    }),
    [validation, matchState, state.newSets.length, state.p1Points, state.p2Points, completedSets.length, tiebreakValidation.tiebreakImpossible],
  );

  const partial = validation.bothFilled && !validation.isSetTrulyCompleted;

  const showGamePointsAtZero = useMemo(
    () => evaluateShowGamePointsAtZero(validation, completedSets.length, state.newSets),
    [validation, completedSets.length, state.newSets],
  );

  const currentScoreBelowOriginal = useMemo(() => {
    if (!currentSets) return false;
    return validation.bothFilled && (validation.p1Val < currentSets.player1 || validation.p2Val < currentSets.player2);
  }, [currentSets, validation.bothFilled, validation.p1Val, validation.p2Val]);

  return {
    validation,
    tiebreakValidation,
    matchState,
    canAddNextSet,
    canConfirmSet,
    canConfirm,
    partial,
    showGamePointsAtZero,
    isPotentialMTSet: matchState.isPotentialMTSet,
    currentScoreBelowOriginal,
  };
}