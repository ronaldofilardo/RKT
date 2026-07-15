import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
import type { EditScoreState, EditScoreValidation, EditScoreMatchState, CompletedSet } from './edit-score-logic';
import {
  calculateValidation,
  calculateMatchState,
  calculateTiebreakValidation,
} from './edit-score-logic';

export interface UseEditScoreCalculatorParams {
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  currentServer: 'player1' | 'player2';
  state: EditScoreState;
  tiebreakP1: string;
  tiebreakP2: string;
}

export interface EditScoreCalculations {
  validation: EditScoreValidation;
  tiebreakValidation: {
    hasValidTiebreak: boolean;
    tiebreakComplete: boolean;
    tiebreakP1Num: number;
    tiebreakP2Num: number;
  };
  matchState: EditScoreMatchState;
  canAddNextSet: boolean;
  canConfirm: boolean;
  partial: boolean;
}

export function useEditScoreCalculator({
  matchFormat,
  completedSets,
  currentServer,
  state,
  tiebreakP1,
  tiebreakP2,
}: UseEditScoreCalculatorParams): EditScoreCalculations {
  const validation = useMemo(
    () => calculateValidation(state.p1Input, state.p2Input, matchFormat, state.newSets.length + completedSets.length),
    [state.p1Input, state.p2Input, matchFormat, state.newSets.length, completedSets.length],
  );

  const tiebreakValidation = useMemo(
    () => calculateTiebreakValidation(tiebreakP1, tiebreakP2, validation.hasTiebreak),
    [tiebreakP1, tiebreakP2, validation.hasTiebreak],
  );

  const matchState = useMemo(
    () => calculateMatchState(matchFormat, completedSets, state.newSets, validation),
    [matchFormat, completedSets, state.newSets, validation],
  );

  const canAddNextSet = useMemo(() => {
    if (!validation.isSetTrulyCompleted) return false;
    if (matchState.totalEditedSets >= matchState.maxSets - 1) return false;
    if (matchState.matchAlreadyOver) return false;
    if (matchState.matchWouldEnd) return false;
    if (matchState.isMatchTiebreakSet) return false;
    if (validation.hasTiebreak && !tiebreakValidation.tiebreakComplete) return false;
    return true;
  }, [validation, matchState, tiebreakValidation]);

  const canConfirm = useMemo(() => {
    const bothFilled = validation.bothFilled;
    const isMatchTiebreakSet = matchState.isMatchTiebreakSet;
    const hasTiebreak = validation.hasTiebreak;
    const tiebreakComplete = tiebreakValidation.tiebreakComplete;
    const isSetTrulyCompleted = validation.isSetTrulyCompleted;
    const setValidationError = validation.setValidationError;

    if (state.newSets.length > 0) return true;
    if (completedSets.length > 0) return true;

    if (!bothFilled) return false;

    if (isMatchTiebreakSet) {
      return !setValidationError || isSetTrulyCompleted;
    }

    if (!hasTiebreak) return true;
    return tiebreakComplete;
  }, [validation, tiebreakValidation, matchState, state.newSets.length, completedSets.length]);

  const partial = validation.bothFilled && !validation.isSetTrulyCompleted;

  return {
    validation,
    tiebreakValidation,
    matchState,
    canAddNextSet,
    canConfirm,
    partial,
  };
}