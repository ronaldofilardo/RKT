import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { EditScoreState, EditScoreValidation, EditScoreMatchState, CompletedSet } from './edit-score-logic';
import type { SetEditData } from './editScoreHelpers';
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
  showGamePointsAtZero: boolean;
}

export function useEditScoreCalculator({
  matchFormat,
  completedSets,
  state,
  tiebreakP1,
  tiebreakP2,
}: UseEditScoreCalculatorParams): EditScoreCalculations {
  const validation = useMemo(() => {
    const setResults: SetEditData[] = [
      ...completedSets.map(cs => ({ p1Games: cs.games.player1, p2Games: cs.games.player2, isPartial: false })),
      ...state.newSets,
    ];
    return calculateValidation({
      p1Input: state.p1Input,
      p2Input: state.p2Input,
      matchFormat,
      totalEditedSets: state.newSets.length + completedSets.length,
      setResults,
    });
  }, [state.p1Input, state.p2Input, matchFormat, state.newSets, completedSets]);

  const tiebreakValidation = useMemo(
    () => calculateTiebreakValidation(tiebreakP1, tiebreakP2, validation.hasTiebreak),
    [tiebreakP1, tiebreakP2, validation.hasTiebreak],
  );

  const matchState = useMemo(() => calculateMatchState({
    matchFormat,
    completedSets,
    newSets: state.newSets,
    validation,
  }), [matchFormat, completedSets, state.newSets, validation]);

  const { p1Val, p2Val } = validation;

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
    const tiebreakRequired = validation.setValidation?.tiebreakRequired ?? false;

    if (state.newSets.length > 0) return true;
    if (completedSets.length > 0) return true;

    if (!bothFilled) return false;

    if (isMatchTiebreakSet) {
      return !setValidationError || isSetTrulyCompleted;
    }

    if (!hasTiebreak) return true;
    
    // For regular tiebreak sets: allow confirm if tiebreak not required yet (partial score like 6-5)
    // or if tiebreak is complete
    if (!tiebreakRequired) return true;
    return tiebreakComplete;
  }, [validation, tiebreakValidation, matchState, state.newSets.length, completedSets.length]);

  const partial = validation.bothFilled && !validation.isSetTrulyCompleted;

  const showGamePointsAtZero = useMemo(() => {
    const hasPreviousSets = completedSets.length > 0 || state.newSets.length > 0;
    const isAtZero = !validation.bothFilled || (p1Val === 0 && p2Val === 0);
    const prevSetCompleted = state.newSets.length > 0
      ? state.newSets[state.newSets.length - 1].isPartial === false
      : completedSets.length > 0;
    return hasPreviousSets && isAtZero && prevSetCompleted;
  }, [validation, p1Val, p2Val, completedSets.length, state.newSets]);

  return {
    validation,
    tiebreakValidation,
    matchState,
    canAddNextSet,
    canConfirm,
    partial,
    showGamePointsAtZero,
  };
}