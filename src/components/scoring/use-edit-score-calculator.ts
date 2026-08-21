import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { EditScoreState, EditScoreValidation, EditScoreMatchState, CompletedSet } from './edit-score-logic';
import type { SetEditData } from './editScoreHelpers';
import {
  calculateValidation,
  calculateMatchState,
  calculateTiebreakValidation,
} from './edit-score-logic';
import {
  canAddNextSet as canAddNextSetDecision,
  canConfirm as canConfirmDecision,
  canConfirmSet as canConfirmSetDecision,
  shouldShowGamePointsAtZero,
} from './use-edit-score-calculator.helpers';

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
  canConfirmSet: boolean;
  canConfirm: boolean;
  partial: boolean;
  showGamePointsAtZero: boolean;
  isPotentialMTSet: boolean;
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
      tiebreakP1: tiebreakP1,
      tiebreakP2: tiebreakP2,
    });
  }, [state.p1Input, state.p2Input, matchFormat, state.newSets, completedSets, tiebreakP1, tiebreakP2]);

  const tiebreakValidation = useMemo(
    () => calculateTiebreakValidation(tiebreakP1, tiebreakP2, validation.hasTiebreak || !!validation.setValidation?.tiebreakRequired),
    [tiebreakP1, tiebreakP2, validation.hasTiebreak, validation.setValidation],
  );

  const matchState = useMemo(() => calculateMatchState({
    matchFormat,
    completedSets,
    newSets: state.newSets,
    validation,
    totalEditedSets: state.newSets.length + completedSets.length,
  }), [matchFormat, completedSets, state.newSets, validation]);

  const { p1Val, p2Val } = validation;

  const canAddNextSet = useMemo(
    () => canAddNextSetDecision(validation, matchState, tiebreakValidation),
    [validation, matchState, tiebreakValidation],
  );

  // canConfirmSet: enables the "Confirmar Set" button. Unlike canAddNextSet,
  // this also allows confirming MT sets (where no next set follows).
  const canConfirmSet = useMemo(
    () => canConfirmSetDecision(validation, matchState, tiebreakValidation),
    [validation, tiebreakValidation, matchState],
  );

  const canConfirm = useMemo(
    () => canConfirmDecision(
      validation,
      matchState,
      tiebreakValidation,
      state.newSets.length > 0,
      completedSets.length > 0,
    ),
    [validation, tiebreakValidation, matchState, state.newSets.length, completedSets.length],
  );

  const partial = validation.bothFilled && !validation.isSetTrulyCompleted;

  const showGamePointsAtZero = useMemo(
    () => shouldShowGamePointsAtZero(
      validation,
      p1Val,
      p2Val,
      completedSets.length,
      state.newSets,
    ),
    [validation, p1Val, p2Val, completedSets.length, state.newSets],
  );

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
  };
}