'use client';

import { useCallback } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { CompletedSet } from '@/core/scoring/edit-score-state';
import { executeConfirmFlow } from './use-edit-score-modal-submission.logic';
import type { useEditScoreCalculator } from './use-edit-score-calculator';
import type { EditScoreModalState, UseEditScoreModalOptions } from './useEditScoreModal.types';

type Calculations = ReturnType<typeof useEditScoreCalculator>;
type SetState = React.Dispatch<React.SetStateAction<EditScoreModalState>>;
type SetError = React.Dispatch<React.SetStateAction<string | null>>;

export interface ConfirmActionParams {
  state: EditScoreModalState;
  completedSets: CompletedSet[];
  matchFormat: TennisFormat;
  currentServer: 'player1' | 'player2';
  initialServer?: 'player1' | 'player2';
  calculations: Pick<Calculations, 'validation' | 'tiebreakValidation' | 'matchState' | 'partial' | 'isPotentialMTSet'>;
  currentSets: { player1: number; player2: number };
  floorValidationError: string | null;
  floorCurrentSets: UseEditScoreModalOptions['floorCurrentSets'];
  floorTiebreak: UseEditScoreModalOptions['floorTiebreak'];
  onRefreshFloor: UseEditScoreModalOptions['onRefreshFloor'];
  initialGameRef: React.MutableRefObject<{ player1: string; player2: string } | null>;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
  onConfirm: (setResults: import('@/core/scoring/edit-score-domain').SetEditData[], server: 'player1' | 'player2', note?: string) => void | Promise<void>;
  onMatchFinished?: (winner: 'player1' | 'player2') => void;
  setState: SetState;
  setConfirmError: SetError;
  setIsConfirming: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useEditScoreModalConfirmAction({
  state,
  completedSets,
  matchFormat,
  currentServer,
  initialServer,
  calculations,
  currentSets,
  floorValidationError,
  floorCurrentSets,
  floorTiebreak,
  onRefreshFloor,
  initialGameRef,
  inputTouchedRef,
  onConfirm,
  onMatchFinished,
  setState,
  setConfirmError,
  setIsConfirming,
}: ConfirmActionParams) {
  const { validation, tiebreakValidation, matchState, partial, isPotentialMTSet } = calculations;
  const { tiebreakComplete, tiebreakImpossible, tiebreakP1Num, tiebreakP2Num } = tiebreakValidation;
  const { bothFilled, p1Val, p2Val, isSetTrulyCompleted, hasTiebreak, isMatchTiebreakSet } = validation;
  const { matchWouldEnd } = matchState;

  const confirmCurrentAction = useCallback(async () => {
    await executeConfirmFlow({
      state,
      completedSets,
      matchFormat,
      currentServer,
      initialServer,
      bothFilled, p1Val, p2Val, tiebreakImpossible,
      onRefreshFloor, floorCurrentSets, floorTiebreak,
      isSetTrulyCompleted, validation, floorValidationError,
      partial, hasTiebreak, tiebreakComplete,
      tiebreakP1Num: tiebreakP1Num ?? 0,
      tiebreakP2Num: tiebreakP2Num ?? 0,
      initialGame: initialGameRef.current,
      isMatchTiebreakSet, isPotentialMTSet, currentSets, matchWouldEnd,
      onConfirm, onMatchFinished,
      setState, setConfirmError, setIsConfirming,
      inputTouchedRef,
    });
  }, [
    onRefreshFloor, floorCurrentSets, floorTiebreak, isSetTrulyCompleted, p1Val, p2Val,
    floorValidationError, validation, partial, hasTiebreak, tiebreakComplete, tiebreakImpossible,
    tiebreakP1Num, tiebreakP2Num, matchWouldEnd, currentServer, initialServer, state, completedSets, matchFormat,
    bothFilled, isMatchTiebreakSet, isPotentialMTSet, currentSets, onConfirm, onMatchFinished,
    initialGameRef, inputTouchedRef, setState, setConfirmError, setIsConfirming,
  ]);

  return { confirmCurrentAction };
}
