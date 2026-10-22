// ste-exception R-03: casca de wiring React (useMemo) da API do calculator;
// toda a lógica de decisão vive em src/core/scoring/edit-score-calculator.*.ts (≤100L).
import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type {
  CompletedSet,
  EditScoreState,
  EditScoreValidation,
  EditScoreMatchState,
} from '@/core/scoring/edit-score-state';
import {
  calculateValidation,
  calculateMatchState,
  calculateTiebreakValidation,
} from '@/core/scoring/edit-score-state';
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { evaluateCanConfirm, evaluateCanConfirmSet } from '@/core/scoring/edit-score-calculator.confirm';
import { evaluateCanAddNextSet, evaluateShowGamePointsAtZero } from '@/core/scoring/edit-score-calculator.set-gates';

interface UseEditScoreCalculatorParams {
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  editableCompletedSets?: SetEditData[];
  state: EditScoreState;
  tiebreakP1: string;
  tiebreakP2: string;
  currentSets?: { player1: number; player2: number };
  floorCurrentSets?: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
}

interface EditScoreCalculations {
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

export function useEditScoreCalculator({
  matchFormat,
  completedSets,
  editableCompletedSets,
  state,
  tiebreakP1,
  tiebreakP2,
  currentSets,
  floorCurrentSets,
  floorTiebreak,
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
      floorCurrentSets,
      floorTiebreak,
      tiebreakP1Num: tiebreakValidation.tiebreakP1Num,
      tiebreakP2Num: tiebreakValidation.tiebreakP2Num,
    }),
    [validation, matchState, state.newSets.length, state.p1Points, state.p2Points, completedSets.length, tiebreakValidation.tiebreakImpossible, tiebreakValidation.tiebreakP1Num, tiebreakValidation.tiebreakP2Num, floorCurrentSets, floorTiebreak],
  );

  const partial = validation.bothFilled && !validation.isSetTrulyCompleted;

  const showGamePointsAtZero = useMemo(
    () => evaluateShowGamePointsAtZero(validation, completedSets.length, state.newSets),
    [validation, completedSets.length, state.newSets],
  );

  const currentScoreBelowOriginal = useMemo(() => {
    const gamesBelow = floorCurrentSets
      ? validation.bothFilled && (validation.p1Val < floorCurrentSets.player1 || validation.p2Val < floorCurrentSets.player2)
      : false;
    const tbBelow = floorTiebreak && validation.hasTiebreak && !validation.isSetTrulyCompleted
      ? (tiebreakValidation.tiebreakP1Num < floorTiebreak.player1 || tiebreakValidation.tiebreakP2Num < floorTiebreak.player2)
      : false;
    return gamesBelow || tbBelow;
  }, [floorCurrentSets, floorTiebreak, validation.bothFilled, validation.p1Val, validation.p2Val, validation.hasTiebreak, validation.isSetTrulyCompleted, tiebreakValidation.tiebreakP1Num, tiebreakValidation.tiebreakP2Num]);

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
