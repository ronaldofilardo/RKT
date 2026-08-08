"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TennisFormat } from "@/core/scoring/types";
import { logger } from "@/lib/logger";
import type { SetEditData } from "./editScoreHelpers";
import type { CompletedSet } from "./edit-score-logic";
import {
  createInitialEditScoreState,
  createSetEditData,
  calculateNextServer,
} from "./edit-score-logic";
import { parsePointValue, pointToProgress } from "@/core/scoring/point-utils";
import { useEditScoreCalculator } from "./use-edit-score-calculator";

interface EditScoreModalState {
  p1Input: string;
  p2Input: string;
  tiebreakP1: string;
  tiebreakP2: string;
  p1Points: string;
  p2Points: string;
  nextServer: "player1" | "player2";
  newSets: SetEditData[];
  editableCompletedSets: Array<{
    p1Games: number;
    p2Games: number;
    isPartial: boolean;
    tiebreakScore?: { player1: number; player2: number } | null;
  }>;
}

interface UseEditScoreModalOptions {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: "player1" | "player2";
  completedSets: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  floorCurrentSets?: { player1: number; player2: number } | null;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
}

interface UseEditScoreModalReturn {
  state: EditScoreModalState;
  setState: React.Dispatch<React.SetStateAction<EditScoreModalState>>;
  confirmError: string | null;
  floorValidationError: string | null;
  isFinishingMatch: boolean;
  calculations: any;
  handleGameInputChange: (value: string, setter: (v: string) => void, player: 'p1' | 'p2') => void;
  handleConfirm: () => Promise<void>;
  handleCancel: () => void;
  handleAddSet: () => void;
  handleConfirmSet: () => void;
  canConfirmSet: boolean;
  handlePointsChange: (p1: string, p2: string) => void;
  handleEditCompletedSet: (index: number, p1Games: number, p2Games: number) => void;
  handleRemoveCompletedSet: (index: number) => void;
  resetState: () => void;
}

export function useEditScoreModal(
  options: UseEditScoreModalOptions,
  onConfirm: (setResults: SetEditData[], server: "player1" | "player2") => void,
  onCancel: () => void,
  onMatchFinished?: (winner: "player1" | "player2") => void
): UseEditScoreModalReturn {
  const {
    isOpen,
    matchFormat,
    currentSets,
    currentServer,
    completedSets,
    currentGamePoints,
    floorCurrentSets,
    onRefreshFloor,
  } = options;

  const [state, setState] = useState<EditScoreModalState>(() => {
    const initialState = createInitialEditScoreState(currentServer);
    return {
      ...initialState,
      editableCompletedSets: completedSets.map((cs) => ({
        p1Games: cs.games.player1,
        p2Games: cs.games.player2,
        isPartial: false,
        tiebreakScore: cs.tiebreakScore,
      })),
    };
  });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [floorValidationError, setFloorValidationError] = useState<string | null>(null);
  const [isFinishingMatch, setIsFinishingMatch] = useState(false);

  const initializedRef = useRef(false);
  const initialGameRef = useRef<{ player1: string; player2: string } | null>(null);
  const inputTouchedRef = useRef({ p1: false, p2: false });
  // Track the previous open state to detect transitions (false -> true),
  // so we only fully reset state when the modal (re)opens — not on every
  // re-render of the parent that passes a new (identity-different) completedSets prop.
  const prevIsOpenRef = useRef(false);
  // Track the serialized content of completedSets so we don't reset state
  // when only the array identity changes (but content stays the same).
  const lastCompletedSetsKeyRef = useRef<string>("");

  const calculations = useEditScoreCalculator({
    matchFormat,
    completedSets: completedSets as CompletedSet[],
    currentServer,
    state,
    tiebreakP1: state.tiebreakP1,
    tiebreakP2: state.tiebreakP2,
  });

  const { validation, tiebreakValidation, matchState, canAddNextSet, canConfirmSet: canConfirmSetCalc, partial, isPotentialMTSet } = calculations;
  const { tiebreakComplete, tiebreakP1Num, tiebreakP2Num } = tiebreakValidation;
  const { p1Val, p2Val, bothFilled, isSetTrulyCompleted, hasTiebreak, isMatchTiebreakSet } = validation;
  const { matchWouldEnd, maxSets, setsToWin } = matchState;
  const { playerNames } = options as any;

  // Reset state ONLY when:
  //   (a) the modal transitions from closed -> open, OR
  //   (b) the *content* of completedSets changes (not just array identity).
  // This prevents production re-renders (which create new completedSets arrays)
  // from wiping out the user's in-progress selections (inputs, points, newSets).
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const completedSetsKey = completedSets
      .map(cs => `${cs.games.player1}-${cs.games.player2}-${cs.winner}${cs.tiebreakScore ? `:${cs.tiebreakScore.player1}-${cs.tiebreakScore.player2}` : ""}`)
      .join("|");
    const completedSetsChanged = completedSetsKey !== lastCompletedSetsKeyRef.current;

    if (justOpened) {
      setState(_prev => ({
        ...createInitialEditScoreState(currentServer),
        editableCompletedSets: completedSets.map((cs) => ({
          p1Games: cs.games.player1,
          p2Games: cs.games.player2,
          isPartial: false,
          tiebreakScore: cs.tiebreakScore,
        })),
      }));
      setConfirmError(null);
      setFloorValidationError(null);
      initializedRef.current = false;
      initialGameRef.current = null;
      setIsFinishingMatch(false);
      inputTouchedRef.current = { p1: false, p2: false };
      lastCompletedSetsKeyRef.current = completedSetsKey;
    } else if (isOpen && completedSetsChanged) {
      // Only the completed sets changed (new set added externally); sync the
      // editableCompletedSets without wiping the user's input/points/newSets.
      setState(prev => ({
        ...prev,
        editableCompletedSets: completedSets.map((cs) => ({
          p1Games: cs.games.player1,
          p2Games: cs.games.player2,
          isPartial: false,
          tiebreakScore: cs.tiebreakScore,
        })),
      }));
      setConfirmError(null);
      setFloorValidationError(null);
      lastCompletedSetsKeyRef.current = completedSetsKey;
    } else if (!isOpen) {
      initializedRef.current = false;
      initialGameRef.current = null;
      setIsFinishingMatch(false);
      inputTouchedRef.current = { p1: false, p2: false };
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, currentServer, completedSets]);

  useEffect(() => {
    if (isOpen && !initializedRef.current) {
      setState(prev => ({
        ...prev,
        p1Input: currentSets.player1.toString(),
        p2Input: currentSets.player2.toString(),
      }));

      const gamePoints = currentGamePoints;
      if (gamePoints) {
        const p1 = typeof gamePoints.player1 === "number" ? gamePoints.player1.toString() : gamePoints.player1;
        const p2 = typeof gamePoints.player2 === "number" ? gamePoints.player2.toString() : gamePoints.player2;
        initialGameRef.current = { player1: p1, player2: p2 };
        setState(prev => ({ ...prev, p1Points: p1, p2Points: p2 }));
      }

      initializedRef.current = true;
    }
  }, [isOpen, currentSets, currentGamePoints]);

  const handleGameInputChange = useCallback((value: string, setter: (v: string) => void, player: 'p1' | 'p2'): void => {
    inputTouchedRef.current[player] = true;
    setConfirmError(null);
    setFloorValidationError(null);
    if (value === "") {
      setter("");
      setState(prev => ({ ...prev, tiebreakP1: "", tiebreakP2: "" }));
      return;
    }
    if (!/^\d+$/.test(value)) return;
    const num = parseInt(value, 10);
    setter(num > 50 ? "50" : num.toString());
    setState(prev => ({ ...prev, tiebreakP1: "", tiebreakP2: "" }));
  }, []);

  const handleConfirm = useCallback(async () => {
    if (isFinishingMatch) return;
    setConfirmError(null);
    
    if (onRefreshFloor && floorCurrentSets && !isSetTrulyCompleted) {
      try {
        const freshFloor = await onRefreshFloor();
        if (freshFloor) {
          if (p1Val < freshFloor.player1 || p2Val < freshFloor.player2) {
            setConfirmError(
              `Placar atualizado: ${freshFloor.player1}x${freshFloor.player2}. Seu placar (${p1Val}x${p2Val}) é inferior.`
            );
            return;
          }
        }
      } catch (err) {
        logger.error('[handleConfirm] Failed to refresh floor:', err);
      }
    }
    
    if (floorValidationError) return;
    if (validation.setValidationError && !partial) return;
    if (validation.setValidation?.tiebreakRequired) return;

    if (bothFilled && hasTiebreak && isSetTrulyCompleted && tiebreakComplete) {
      const setWinner = p1Val > p2Val ? "player1" : "player2";
      const tiebreakWinner = tiebreakP1Num > tiebreakP2Num ? "player1" : "player2";
      if (setWinner !== tiebreakWinner) {
        setConfirmError("Vencedor do tiebreak não corresponde ao vencedor do set.");
        return;
      }
    }

    if (isSetTrulyCompleted && matchWouldEnd) {
      const wouldBeP1Sets = matchState.p1SetsWonFromProp + matchState.newP1SetsWon + (validation.setValidation?.winner === "player1" ? 1 : 0);
      const wouldBeP2Sets = matchState.p2SetsWonFromProp + matchState.newP2SetsWon + (validation.setValidation?.winner === "player2" ? 1 : 0);
      if (wouldBeP1Sets > setsToWin || wouldBeP2Sets > setsToWin) {
        setConfirmError(
          `Partida já encerrou com ${setsToWin} sets para ${wouldBeP1Sets > setsToWin ? playerNames?.p1 : playerNames?.p2}.`,
        );
        return;
      }
    }

    if (bothFilled && floorCurrentSets) {
      if (p1Val < floorCurrentSets.player1 || p2Val < floorCurrentSets.player2) {
        setConfirmError(
          `Placar não pode ser inferior ao ponto de parada (${floorCurrentSets.player1}x${floorCurrentSets.player2}).`,
        );
        return;
      }
    }

    if (isSetTrulyCompleted && !matchWouldEnd && !canAddNextSet && maxSets > 1) {
      return;
    }

    if (!isSetTrulyCompleted && initialGameRef.current) {
      const sameSetScore = p1Val === currentSets.player1 && p2Val === currentSets.player2;

      if (sameSetScore) {
        const initial = initialGameRef.current;
        const oldP1 = pointToProgress(parsePointValue(initial.player1));
        const oldP2 = pointToProgress(parsePointValue(initial.player2));
        const newP1 = pointToProgress(parsePointValue(state.p1Points));
        const newP2 = pointToProgress(parsePointValue(state.p2Points));

        if ((newP1 < oldP1 && newP2 <= oldP2) || (newP2 < oldP2 && newP1 <= oldP1)) {
          setConfirmError("Placar não pode ser inferior ao estado atual");
          return;
        }
      }
    }

    const sourceCompleted: CompletedSet[] =
      state.editableCompletedSets && state.editableCompletedSets.length > 0
        ? state.editableCompletedSets.map((ecs) => ({
            games: { player1: ecs.p1Games, player2: ecs.p2Games },
            winner: ecs.p1Games > ecs.p2Games ? 'player1' : ecs.p2Games > ecs.p1Games ? 'player2' : 'player1',
            tiebreakScore: ecs.tiebreakScore ?? undefined,
          }))
        : completedSets;
    const existingCompleted: SetEditData[] = sourceCompleted.map((cs) => ({
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
      tiebreakScore: cs.tiebreakScore ?? undefined,
    }));
    const finalSets = [...existingCompleted, ...state.newSets];
    
    if (bothFilled) {
      const setData = createSetEditData({
        p1Val,
        p2Val,
        isSetTrulyCompleted,
        hasTiebreak,
        tiebreakP1Num: tiebreakP1Num ?? 0,
        tiebreakP2Num: tiebreakP2Num ?? 0,
        isMatchTiebreakSet,
        isPotentialMTSet,
        p1Points: state.p1Points,
        p2Points: state.p2Points,
        currentSets,
      });
      finalSets.push(setData);
    }

    const nextServer = state.nextServer || currentServer;
    
    if (matchWouldEnd && isSetTrulyCompleted) {
      setIsFinishingMatch(true);
    }
    
    onConfirm(finalSets, nextServer);

    // Call onMatchFinished if the match would end with this set
    if (matchWouldEnd && isSetTrulyCompleted && onMatchFinished) {
      const winner = validation.setValidation?.winner === "player1" ? "player1" : "player2";
      onMatchFinished(winner);
    }
  }, [
    onRefreshFloor, floorCurrentSets, isSetTrulyCompleted, p1Val, p2Val,
    floorValidationError, validation, partial, hasTiebreak, tiebreakComplete,
    tiebreakP1Num, tiebreakP2Num, matchWouldEnd, matchState, setsToWin,
    playerNames, canAddNextSet, maxSets, currentSets, initialGameRef,
    state.p1Points, state.p2Points, state.newSets, state.nextServer,
    state.editableCompletedSets,
    completedSets, onConfirm, currentServer, onMatchFinished,
    isFinishingMatch, bothFilled, isMatchTiebreakSet, isPotentialMTSet,
  ]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  const handleAddSet = useCallback(() => {
    if (!canAddNextSet) return;

    const p1Games = parseInt(state.p1Input, 10) || 0;
    const p2Games = parseInt(state.p2Input, 10) || 0;
    const tbP1Num = parseInt(state.tiebreakP1, 10);
    const tbP2Num = parseInt(state.tiebreakP2, 10);
    const hasTiebreakScore =
      !isNaN(tbP1Num) && !isNaN(tbP2Num) &&
      tbP1Num >= 0 && tbP2Num >= 0 &&
      (tbP1Num > 0 || tbP2Num > 0);

    const setData: SetEditData = {
      p1Games,
      p2Games,
      isPartial: false,
      ...(hasTiebreakScore
        ? { tiebreakScore: { player1: tbP1Num, player2: tbP2Num } }
        : {}),
    };

    // For MT sets, p1Games/p2Games ARE the tiebreak points, so pass them
    // as tiebreakScore to ensure correct server calculation.
    const tiebreakForServer = isMatchTiebreakSet
      ? { player1: p1Games, player2: p2Games }
      : hasTiebreakScore
        ? { player1: tbP1Num, player2: tbP2Num }
        : null;

    setState(prev => ({
      ...prev,
      newSets: [...prev.newSets, setData],
      p1Input: "",
      p2Input: "",
      tiebreakP1: "",
      tiebreakP2: "",
      nextServer: calculateNextServer({
        currentServer,
        p1Games,
        p2Games,
        matchFormat,
        tiebreakScore: tiebreakForServer,
        completedSets: completedSets as CompletedSet[],
      }),
    }));
  }, [canAddNextSet, state.p1Input, state.p2Input, state.tiebreakP1, state.tiebreakP2, currentServer, matchFormat, completedSets, isMatchTiebreakSet]);

  const handlePointsChange = useCallback((p1: string, p2: string) => {
    setState(prev => ({ ...prev, p1Points: p1, p2Points: p2 }));
  }, []);

  const handleEditCompletedSet = useCallback((index: number, p1Games: number, p2Games: number) => {
    setState(prev => {
      const newEditable = [...prev.editableCompletedSets];
      if (newEditable[index]) {
        newEditable[index] = { ...newEditable[index], p1Games, p2Games };
      }
      return { ...prev, editableCompletedSets: newEditable };
    });
    setConfirmError(null);
    setFloorValidationError(null);
  }, []);

  const handleRemoveCompletedSet = useCallback((index: number) => {
    setState(prev => {
      const newEditable = prev.editableCompletedSets.filter((_, i) => i !== index);
      return { ...prev, editableCompletedSets: newEditable };
    });
    setConfirmError(null);
    setFloorValidationError(null);
  }, []);

  const handleConfirmSet = useCallback(() => {
    if (!canConfirmSetCalc) return;
    if (isMatchTiebreakSet) {
      // MT: just confirm the current set (don't add to newSets, match ends)
      handleConfirm();
      return;
    }
    handleAddSet();
    setState(prev => ({
      ...prev,
      p1Input: "",
      p2Input: "",
      tiebreakP1: "",
      tiebreakP2: "",
      p1Points: "0",
      p2Points: "0",
    }));
    inputTouchedRef.current = { p1: false, p2: false };
  }, [canConfirmSetCalc, isMatchTiebreakSet, handleAddSet, handleConfirm]);

  const resetState = useCallback(() => {
    setState({
      ...createInitialEditScoreState(currentServer),
      editableCompletedSets: completedSets.map((cs) => ({
        p1Games: cs.games.player1,
        p2Games: cs.games.player2,
        isPartial: false,
        tiebreakScore: cs.tiebreakScore,
      })),
    });
    setConfirmError(null);
    setFloorValidationError(null);
    initializedRef.current = false;
    setIsFinishingMatch(false);
  }, [currentServer, completedSets]);

return {
    state,
    setState,
    confirmError,
    floorValidationError,
    isFinishingMatch,
    calculations,
    handleGameInputChange,
    handleConfirm,
    handleCancel,
    handleAddSet,
    handleConfirmSet,
    canConfirmSet: canConfirmSetCalc,
    handlePointsChange,
    handleEditCompletedSet,
    handleRemoveCompletedSet,
    resetState,
  };
}