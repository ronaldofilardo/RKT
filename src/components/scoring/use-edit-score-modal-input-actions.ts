'use client';

import { useCallback } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import {
  computeGameInputChange,
  computeTiebreakInputChange,
} from './use-edit-score-modal-input.logic';
import type { EditScoreModalState } from './useEditScoreModal.types';

type SetState = React.Dispatch<React.SetStateAction<EditScoreModalState>>;
type SetError = React.Dispatch<React.SetStateAction<string | null>>;

export interface InputActionsParams {
  state: EditScoreModalState;
  setState: SetState;
  setConfirmError: SetError;
  setFloorValidationError: SetError;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
  matchFormat: TennisFormat;
  currentSets: { player1: number; player2: number };
  floorCurrentSets?: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  currentGamePoints?: { player1: number | string; player2: number | string };
  isMatchTiebreakSet: boolean;
}

export function useEditScoreModalInputActions({
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
}: InputActionsParams) {
  const updateGameInputValue = useCallback((value: string, setter: (v: string) => void, player: 'p1' | 'p2', otherInput?: string): void => {
    inputTouchedRef.current[player] = true;
    setConfirmError(null);
    setFloorValidationError(null);

    const minGames = floorCurrentSets ? (player === 'p1' ? floorCurrentSets.player1 : floorCurrentSets.player2) : undefined;

    const result = computeGameInputChange({
      value,
      isMatchTiebreakSet: isMatchTiebreakSet,
      matchFormat: matchFormat,
      otherInput,
      currentSets: currentSets,
      player,
      currentInputVal: player === 'p1' ? state.p1Input : state.p2Input,
      minGames,
    });

    if (result.shouldSet) {
      setter(result.valueToSet);
      if (result.clearTiebreak) {
        setState((prev) => ({ ...prev, tiebreakP1: "", tiebreakP2: "" }));
      }
    }
  }, [matchFormat, isMatchTiebreakSet, currentSets, floorCurrentSets, state.p1Input, state.p2Input, inputTouchedRef, setState, setConfirmError, setFloorValidationError]);

  const updateTiebreakInputValue = useCallback((value: string, player: 'p1' | 'p2'): void => {
    setConfirmError(null);
    setFloorValidationError(null);

    const minPoints = floorTiebreak ? (player === 'p1' ? floorTiebreak.player1 : floorTiebreak.player2) : undefined;

    const result = computeTiebreakInputChange({
      value,
      player,
      currentGamePoints: currentGamePoints,
      currentTbInputVal: player === 'p1' ? state.tiebreakP1 : state.tiebreakP2,
      minPoints,
    });

    if (result.shouldSet) {
      setState((prev) => ({ ...prev, [player === 'p1' ? 'tiebreakP1' : 'tiebreakP2']: result.valueToSet }));
    }
  }, [currentGamePoints, floorTiebreak, state.tiebreakP1, state.tiebreakP2, setState, setConfirmError, setFloorValidationError]);

  const updatePointTotals = useCallback((p1: string, p2: string) => {
    setConfirmError(null);
    setFloorValidationError(null);
    setState((prev) => ({ ...prev, p1Points: p1, p2Points: p2 }));
  }, [setState, setConfirmError, setFloorValidationError]);

  return { updateGameInputValue, updateTiebreakInputValue, updatePointTotals };
}
