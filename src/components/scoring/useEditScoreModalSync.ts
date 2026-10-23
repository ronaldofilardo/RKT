import { useEffect, useRef } from "react";
import type { CompletedSet } from "@/core/scoring/edit-score-state";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import type { UseEditScoreModalSyncParams } from "./useEditScoreModalSync.types";
import {
  createInitialModalState,
  updateEditableCompletedSets,
  serializeCompletedSets,
  applyInitialGamePoints,
} from "./edit-score-modal-sync-logic";

function useModalOpenLifecycleSync(params: {
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

function useModalInputInitSync(params: {
  isOpen: boolean;
  currentSets: { player1: number; player2: number };
  currentGamePoints?: { player1: number | string; player2: number | string };
  isTiebreak?: boolean;
  isMatchTiebreakSet: boolean;
  p1Val: number;
  p2Val: number;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  initializedRef: React.MutableRefObject<boolean>;
  initialGameRef: React.MutableRefObject<{ player1: string; player2: string } | null>;
}) {
  const {
    isOpen,
    currentSets,
    currentGamePoints,
    isTiebreak,
    isMatchTiebreakSet,
    p1Val,
    p2Val,
    setState,
    initializedRef,
    initialGameRef,
  } = params;

  const prevIsMatchTiebreakSetRef = useRef(false);

  useEffect(() => {
    if (!isOpen || initializedRef.current) return;

    setState((prev) => ({
      ...prev,
      p1Input: currentSets.player1.toString(),
      p2Input: currentSets.player2.toString(),
    }));

    applyInitialGamePoints(currentGamePoints, isTiebreak, setState, initialGameRef);
    initializedRef.current = true;
  }, [isOpen, currentSets, currentGamePoints, isTiebreak, setState, initializedRef, initialGameRef]);

  useEffect(() => {
    if (isMatchTiebreakSet && !prevIsMatchTiebreakSetRef.current && p1Val === 6 && p2Val === 6) {
      setState((prev) => ({
        ...prev,
        p1Input: "0",
        p2Input: "0",
        tiebreakP1: "",
        tiebreakP2: "",
      }));
    }
    prevIsMatchTiebreakSetRef.current = isMatchTiebreakSet;
  }, [isMatchTiebreakSet, p1Val, p2Val, setState]);
}

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
