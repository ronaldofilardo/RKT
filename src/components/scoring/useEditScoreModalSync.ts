import { useRef } from "react";
import type { UseEditScoreModalSyncParams } from "./useEditScoreModalSync.types";
import { useModalOpenLifecycleSync } from "./use-edit-score-modal-open-sync";
import { useModalInputInitSync } from "./use-edit-score-modal-input-sync";

export function useEditScoreModalSync(params: UseEditScoreModalSyncParams) {
  const initializedRef = useRef(false);
  const initialGameRef = useRef<{ player1: string; player2: string } | null>(null);
  const inputTouchedRef = useRef({ p1: false, p2: false });
  const editedCompletedSetIndicesRef = useRef<Set<number>>(new Set());

  useModalOpenLifecycleSync({
    isOpen: params.isOpen,
    currentServer: params.currentServer,
    completedSets: params.completedSets,
    setState: params.setState,
    setConfirmError: params.setConfirmError,
    setFloorValidationError: params.setFloorValidationError,
    setIsConfirming: params.setIsConfirming,
    initializedRef,
    initialGameRef,
    inputTouchedRef,
    editedCompletedSetIndicesRef,
  });

  useModalInputInitSync({
    isOpen: params.isOpen,
    currentSets: params.currentSets,
    currentGamePoints: params.currentGamePoints,
    isTiebreak: params.isTiebreak,
    isMatchTiebreakSet: params.isMatchTiebreakSet,
    p1Val: params.p1Val,
    p2Val: params.p2Val,
    setState: params.setState,
    initializedRef,
    initialGameRef,
  });

  return {
    initialGameRef,
    inputTouchedRef,
    editedCompletedSetIndicesRef,
    initializedRef,
  };
}
