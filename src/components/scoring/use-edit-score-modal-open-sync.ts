import { useEffect, useRef } from "react";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import {
  createInitialModalState,
  updateEditableCompletedSets,
  serializeCompletedSets,
} from "./edit-score-modal-sync-logic";

export function useModalOpenLifecycleSync(params: {
  isOpen: boolean;
  currentServer: "player1" | "player2";
  completedSets: CompletedSet[];
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  setConfirmError: (err: string | null) => void;
  setFloorValidationError: (err: string | null) => void;
  setIsConfirming: (val: boolean) => void;
  initializedRef: React.MutableRefObject<boolean>;
  initialGameRef: React.MutableRefObject<{ player1: string; player2: string } | null>;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
  editedCompletedSetIndicesRef: React.MutableRefObject<Set<number>>;
}) {
  const {
    isOpen,
    currentServer,
    completedSets,
    setState,
    setConfirmError,
    setFloorValidationError,
    setIsConfirming,
    initializedRef,
    initialGameRef,
    inputTouchedRef,
    editedCompletedSetIndicesRef,
  } = params;

  const prevIsOpenRef = useRef(false);
  const lastCompletedSetsKeyRef = useRef<string>("");

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const completedSetsKey = serializeCompletedSets(completedSets);
    const completedSetsChanged = completedSetsKey !== lastCompletedSetsKeyRef.current;

    if (justOpened) {
      setState(() => createInitialModalState(currentServer, completedSets));
      setConfirmError(null);
      setFloorValidationError(null);
      setIsConfirming(false);
      initializedRef.current = false;
      initialGameRef.current = null;
      inputTouchedRef.current = { p1: false, p2: false };
      lastCompletedSetsKeyRef.current = completedSetsKey;
      editedCompletedSetIndicesRef.current = new Set();
    } else if (isOpen && completedSetsChanged) {
      setState((prev) => ({
        ...prev,
        editableCompletedSets: updateEditableCompletedSets(
          completedSets,
          prev.editableCompletedSets,
          editedCompletedSetIndicesRef.current,
        ),
      }));
      setConfirmError(null);
      setFloorValidationError(null);
      lastCompletedSetsKeyRef.current = completedSetsKey;
    } else if (!isOpen) {
      initializedRef.current = false;
      initialGameRef.current = null;
      inputTouchedRef.current = { p1: false, p2: false };
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentServer, completedSets, setState, setConfirmError, setFloorValidationError, setIsConfirming, initializedRef, initialGameRef, inputTouchedRef, editedCompletedSetIndicesRef]);
}
