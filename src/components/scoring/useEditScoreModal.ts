"use client";

import { useState, useCallback } from "react";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { createInitialEditScoreState } from "@/core/scoring/edit-score-state";
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/use-session-manager.logic';
import { useEditScoreCalculator } from "./use-edit-score-calculator";
import {
  performAddSet,
  performConfirmSet,
} from "./use-edit-score-modal-input.logic";
import { executeConfirmFlow } from "./use-edit-score-modal-submission.logic";
import { useEditScoreModalSync } from "./useEditScoreModalSync";
import { useEditScoreModalInputActions } from "./use-edit-score-modal-input-actions";
import { useEditScoreModalEditActions } from "./use-edit-score-modal-edit-actions";
import type {
  UseEditScoreModalOptions,
  UseEditScoreModalReturn,
  EditScoreModalState,
} from "./useEditScoreModal.types";

export type * from "./useEditScoreModal.types";

export function useEditScoreModal(
  options: UseEditScoreModalOptions,
  onConfirm: (setResults: SetEditData[], server: "player1" | "player2", note?: string) => void | Promise<void>,
  onCancel: () => void,
  onMatchFinished?: (winner: "player1" | "player2") => void,
): UseEditScoreModalReturn {
  const {
    isOpen,
    matchFormat,
    currentSets,
    currentServer,
    initialServer,
    completedSets,
    currentGamePoints,
    isTiebreak,
    floorCurrentSets,
    floorTiebreak,
    onRefreshFloor,
  } = options;

  const [state, setState] = useState<EditScoreModalState>(() => {
    const editableCompletedSets = completedSets.map((cs) => ({
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
      tiebreakScore: cs.tiebreakScore ?? undefined,
    }));
    const isMT = isMatchTiebreakSetUtil(completedSets.length, editableCompletedSets, matchFormat);
    return {
      ...createInitialEditScoreState(currentServer, matchFormat, isMT),
      editableCompletedSets,
    };
  });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const calculations = useEditScoreCalculator({
    matchFormat,
    completedSets,
    editableCompletedSets: state.editableCompletedSets,
    state,
    tiebreakP1: state.tiebreakP1,
    tiebreakP2: state.tiebreakP2,
    currentSets,
    floorCurrentSets,
    floorTiebreak,
  });

  const { validation, tiebreakValidation, matchState, canAddNextSet, canConfirmSet: canConfirmSetCalc, partial, isPotentialMTSet } = calculations;
  const { tiebreakComplete, tiebreakImpossible, tiebreakP1Num, tiebreakP2Num } = tiebreakValidation;
  const { p1Val, p2Val, bothFilled, isSetTrulyCompleted, hasTiebreak, isMatchTiebreakSet } = validation;
  const { matchWouldEnd } = matchState;

  const { initialGameRef, inputTouchedRef, editedCompletedSetIndicesRef, initializedRef } = useEditScoreModalSync({
    isOpen,
    currentServer,
    completedSets,
    currentSets,
    currentGamePoints,
    isTiebreak,
    isMatchTiebreakSet,
    p1Val,
    p2Val,
    setState,
    setConfirmError,
    setFloorValidationError,
    setIsConfirming,
  });

  const { updateGameInputValue, updateTiebreakInputValue, updatePointTotals } = useEditScoreModalInputActions({
    state,
    setState,
    setConfirmError,
    setFloorValidationError,
    inputTouchedRef,
    matchFormat,
    currentSets,
    floorCurrentSets,
    floorTiebreak,
    currentGamePoints,
    isMatchTiebreakSet,
  });

  const confirmCurrentAction = useCallback(async () => {
    await executeConfirmFlow({
      state,
      completedSets,
      matchFormat,
      currentServer,
      initialServer,
      bothFilled,
      p1Val,
      p2Val,
      tiebreakImpossible,
      onRefreshFloor,
      floorCurrentSets,
      floorTiebreak,
      isSetTrulyCompleted,
      validation,
      floorValidationError,
      partial,
      hasTiebreak,
      tiebreakComplete,
      tiebreakP1Num: tiebreakP1Num ?? 0,
      tiebreakP2Num: tiebreakP2Num ?? 0,
      initialGame: initialGameRef.current,
      isMatchTiebreakSet,
      isPotentialMTSet,
      currentSets,
      matchWouldEnd,
      onConfirm,
      onMatchFinished,
      setState,
      setConfirmError,
      setIsConfirming,
      inputTouchedRef,
    });
  }, [
    onRefreshFloor, floorCurrentSets, floorTiebreak, isSetTrulyCompleted, p1Val, p2Val,
    floorValidationError, validation, partial, hasTiebreak, tiebreakComplete, tiebreakImpossible,
    tiebreakP1Num, tiebreakP2Num, matchWouldEnd, currentServer, initialServer, state, completedSets, matchFormat,
    bothFilled, isMatchTiebreakSet, isPotentialMTSet, currentSets, onConfirm, onMatchFinished,
    initialGameRef, inputTouchedRef,
  ]);

  const cancelCurrentAction = useCallback(() => {
    if (!isConfirming) onCancel();
  }, [onCancel, isConfirming]);

  const addSetToMatch = useCallback(() => {
    performAddSet({
      canAddNextSet,
      state,
      currentServer,
      initialServer,
      matchFormat,
      completedSets,
      isMatchTiebreakSet,
      setState,
    });
  }, [canAddNextSet, state, currentServer, initialServer, matchFormat, completedSets, isMatchTiebreakSet]);

  const { openEditCompletedSet, resetState } = useEditScoreModalEditActions({
    matchFormat,
    completedSets,
    currentServer,
    floorCurrentSets,
    editedCompletedSetIndicesRef,
    initializedRef,
    setState,
    setConfirmError,
    setFloorValidationError,
  });

  const commitSetScore = useCallback(() => {
    performConfirmSet(
      canConfirmSetCalc,
      isMatchTiebreakSet,
      confirmCurrentAction,
      addSetToMatch,
      inputTouchedRef,
    );
  }, [canConfirmSetCalc, isMatchTiebreakSet, addSetToMatch, confirmCurrentAction, inputTouchedRef]);

  return {
    state,
    setState,
    confirmError,
    floorValidationError,
    isConfirming,
    calculations,
    updateGameInputValue,
    updateTiebreakInputValue,
    confirmCurrentAction,
    cancelCurrentAction,
    addSetToMatch,
    commitSetScore,
    canConfirmSet: canConfirmSetCalc,
    updatePointTotals,
    openEditCompletedSet,
    resetState,
  };
}
