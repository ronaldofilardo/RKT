"use client";

import { useState, useCallback } from "react";
import type { SetEditData } from "./editScoreHelpers";
import { createInitialEditScoreState } from "./edit-score-logic";
import { useEditScoreCalculator } from "./use-edit-score-calculator";
import {
  computeGameInputChange,
  computeTiebreakInputChange,
  performAddSet,
  performConfirmSet,
  applyCompletedSetEdit,
} from "./useEditScoreModal.input.helpers";
import { executeConfirmFlow } from "./useEditScoreModal.submission.helpers";
import { useEditScoreModalSync } from "./useEditScoreModalSync";
import type {
  UseEditScoreModalOptions,
  UseEditScoreModalReturn,
  EditScoreModalState,
} from "./useEditScoreModal.types";

export type * from "./useEditScoreModal.types";

export function useEditScoreModal(
  options: UseEditScoreModalOptions,
  onConfirm: (setResults: SetEditData[], server: "player1" | "player2") => void | Promise<void>,
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
    onRefreshFloor,
  } = options;

  const [state, setState] = useState<EditScoreModalState>(() => ({
    ...createInitialEditScoreState(currentServer),
    editableCompletedSets: completedSets.map((cs) => ({
      p1Games: cs.games.player1,
      p2Games: cs.games.player2,
      isPartial: false,
      tiebreakScore: cs.tiebreakScore ?? undefined,
    })),
  }));
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

  const handleGameInputChange = useCallback((value: string, setter: (v: string) => void, player: 'p1' | 'p2', otherInput?: string): void => {
    inputTouchedRef.current[player] = true;
    setConfirmError(null);
    setFloorValidationError(null);

    const result = computeGameInputChange({
      value,
      isMatchTiebreakSet,
      matchFormat,
      otherInput,
      currentSets,
      player,
      currentInputVal: player === 'p1' ? state.p1Input : state.p2Input,
    });

    if (result.shouldSet) {
      setter(result.valueToSet);
      if (result.clearTiebreak) {
        setState((prev) => ({ ...prev, tiebreakP1: "", tiebreakP2: "" }));
      }
    }
  }, [matchFormat, isMatchTiebreakSet, currentSets, state.p1Input, state.p2Input, inputTouchedRef]);

  const handleTiebreakInputChange = useCallback((value: string, player: 'p1' | 'p2'): void => {
    setConfirmError(null);
    setFloorValidationError(null);

    const result = computeTiebreakInputChange({
      value,
      player,
      currentGamePoints,
      currentTbInputVal: player === 'p1' ? state.tiebreakP1 : state.tiebreakP2,
    });

    if (result.shouldSet) {
      setState((prev) => ({ ...prev, [player === 'p1' ? 'tiebreakP1' : 'tiebreakP2']: result.valueToSet }));
    }
  }, [currentGamePoints, state.tiebreakP1, state.tiebreakP2]);

  const handleConfirm = useCallback(async () => {
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
    onRefreshFloor, floorCurrentSets, isSetTrulyCompleted, p1Val, p2Val,
    floorValidationError, validation, partial, hasTiebreak, tiebreakComplete, tiebreakImpossible,
    tiebreakP1Num, tiebreakP2Num, matchWouldEnd, currentServer, initialServer, state, completedSets, matchFormat,
    bothFilled, isMatchTiebreakSet, isPotentialMTSet, currentSets, onConfirm, onMatchFinished,
    initialGameRef, inputTouchedRef,
  ]);

  const handleCancel = useCallback(() => {
    if (!isConfirming) onCancel();
  }, [onCancel, isConfirming]);

  const handleAddSet = useCallback(() => {
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

  const handlePointsChange = useCallback((p1: string, p2: string) => {
    setConfirmError(null);
    setFloorValidationError(null);
    setState((prev) => ({ ...prev, p1Points: p1, p2Points: p2 }));
  }, []);

  const handleEditCompletedSet = useCallback((index: number, p1Games: number, p2Games: number) => {
    applyCompletedSetEdit({
      index,
      p1Games,
      p2Games,
      matchFormat,
      completedSets,
      floorCurrentSets,
      editedCompletedSetIndicesRef,
      setState,
      setConfirmError,
      setFloorValidationError,
    });
  }, [matchFormat, completedSets, floorCurrentSets, editedCompletedSetIndicesRef]);

  const handleConfirmSet = useCallback(() => {
    performConfirmSet(
      canConfirmSetCalc,
      isMatchTiebreakSet,
      handleConfirm,
      handleAddSet,
      setState,
      inputTouchedRef,
    );
  }, [canConfirmSetCalc, isMatchTiebreakSet, handleAddSet, handleConfirm, inputTouchedRef]);

  const resetState = useCallback(() => {
    setState({
      ...createInitialEditScoreState(currentServer),
      editableCompletedSets: completedSets.map((cs) => ({
        p1Games: cs.games.player1,
        p2Games: cs.games.player2,
        isPartial: false,
        tiebreakScore: cs.tiebreakScore ?? undefined,
      })),
    });
    setConfirmError(null);
    setFloorValidationError(null);
    initializedRef.current = false;
  }, [currentServer, completedSets, initializedRef]);

  return {
    state,
    setState,
    confirmError,
    floorValidationError,
    isConfirming,
    calculations,
    handleGameInputChange,
    handleTiebreakInputChange,
    handleConfirm,
    handleCancel,
    handleAddSet,
    handleConfirmSet,
    canConfirmSet: canConfirmSetCalc,
    handlePointsChange,
    handleEditCompletedSet,
    resetState,
  };
}