'use client';

import { useCallback } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { CompletedSet } from '@/core/scoring/edit-score-state';
import { performAddSet, performConfirmSet } from './use-edit-score-modal-input.logic';
import type { EditScoreModalState } from './useEditScoreModal.types';

type SetState = React.Dispatch<React.SetStateAction<EditScoreModalState>>;

export interface SetActionsParams {
  canAddNextSet: boolean;
  canConfirmSet: boolean;
  state: EditScoreModalState;
  currentServer: 'player1' | 'player2';
  initialServer?: 'player1' | 'player2';
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  isMatchTiebreakSet: boolean;
  isConfirming: boolean;
  onCancel: () => void;
  confirmCurrentAction: () => Promise<void>;
  inputTouchedRef: React.MutableRefObject<{ p1: boolean; p2: boolean }>;
  setState: SetState;
}

export function useEditScoreModalSetActions({
  canAddNextSet,
  canConfirmSet,
  state,
  currentServer,
  initialServer,
  matchFormat,
  completedSets,
  isMatchTiebreakSet,
  isConfirming,
  onCancel,
  confirmCurrentAction,
  inputTouchedRef,
  setState,
}: SetActionsParams) {
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
  }, [canAddNextSet, state, currentServer, initialServer, matchFormat, completedSets, isMatchTiebreakSet, setState]);

  const commitSetScore = useCallback(() => {
    performConfirmSet(
      canConfirmSet,
      isMatchTiebreakSet,
      confirmCurrentAction,
      addSetToMatch,
      inputTouchedRef,
    );
  }, [canConfirmSet, isMatchTiebreakSet, addSetToMatch, confirmCurrentAction, inputTouchedRef]);

  return { cancelCurrentAction, addSetToMatch, commitSetScore };
}
