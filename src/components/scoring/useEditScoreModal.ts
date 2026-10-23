"use client";

import { useState } from "react";
import type { SetEditData } from '@/core/scoring/edit-score-domain';
import { createInitialEditScoreState } from "@/core/scoring/edit-score-state";
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/use-session-manager.logic';
import { useEditScoreCalculator } from "./use-edit-score-calculator";
import { useEditScoreModalSync } from "./useEditScoreModalSync";
import { useEditScoreModalInputActions } from "./use-edit-score-modal-input-actions";
import { useEditScoreModalEditActions } from "./use-edit-score-modal-edit-actions";
import { useEditScoreModalConfirmAction } from "./use-edit-score-modal-confirm-action";
import { useEditScoreModalSetActions } from "./use-edit-score-modal-set-actions";
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

  const { validation, canAddNextSet, canConfirmSet: canConfirmSetCalc } = calculations;
  const { p1Val, p2Val, isMatchTiebreakSet } = validation;

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

  const { confirmCurrentAction } = useEditScoreModalConfirmAction({
    state, completedSets, matchFormat, currentServer, initialServer,
    calculations, currentSets, floorValidationError,
    floorCurrentSets, floorTiebreak, onRefreshFloor,
    initialGameRef, inputTouchedRef, onConfirm, onMatchFinished,
    setState, setConfirmError, setIsConfirming,
  });

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

  const { cancelCurrentAction, addSetToMatch, commitSetScore } = useEditScoreModalSetActions({
    canAddNextSet, canConfirmSet: canConfirmSetCalc, state,
    currentServer, initialServer, matchFormat, completedSets,
    isMatchTiebreakSet, isConfirming, onCancel, confirmCurrentAction,
    inputTouchedRef, setState,
  });

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
