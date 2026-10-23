import { useEffect, useRef } from "react";
import type { EditScoreModalState } from "./useEditScoreModal.types";
import { applyInitialGamePoints } from "./edit-score-modal-sync-logic";

export function useModalInputInitSync(params: {
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
