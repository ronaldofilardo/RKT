'use client';

import { useCallback } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import { createInitialEditScoreState } from '@/core/scoring/edit-score-state';
import { isMatchTiebreakSet as isMatchTiebreakSetUtil } from '@/hooks/use-session-manager.logic';
import { applyCompletedSetEdit } from './use-edit-score-modal-input.logic';
import type { CompletedSet } from '@/core/scoring/edit-score-state';
import type { EditScoreModalState } from './useEditScoreModal.types';

type SetState = React.Dispatch<React.SetStateAction<EditScoreModalState>>;
type SetError = React.Dispatch<React.SetStateAction<string | null>>;

export interface EditActionsParams {
  matchFormat: TennisFormat;
  completedSets: CompletedSet[];
  currentServer: 'player1' | 'player2';
  floorCurrentSets?: { player1: number; player2: number } | null;
  editedCompletedSetIndicesRef: React.MutableRefObject<Set<number>>;
  initializedRef: React.MutableRefObject<boolean>;
  setState: SetState;
  setConfirmError: SetError;
  setFloorValidationError: SetError;
}

/**
 * Estado inicial do modal: sets concluídos convertidos em SetEditData
 * (detectando automaticamente se o último set é Match Tiebreak).
 */
export function createEditableInitialState(
  currentServer: 'player1' | 'player2',
  matchFormat: TennisFormat,
  completedSets: CompletedSet[],
): EditScoreModalState {
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
}

export function useEditScoreModalEditActions({
  matchFormat,
  completedSets,
  currentServer,
  floorCurrentSets,
  editedCompletedSetIndicesRef,
  initializedRef,
  setState,
  setConfirmError,
  setFloorValidationError,
}: EditActionsParams) {
  const openEditCompletedSet = useCallback((index: number, p1Games: number, p2Games: number) => {
    applyCompletedSetEdit({
      index,
      p1Games,
      p2Games,
      matchFormat: matchFormat,
      completedSets: completedSets,
      floorCurrentSets: floorCurrentSets,
      editedCompletedSetIndicesRef: editedCompletedSetIndicesRef,
      setState: setState,
      setConfirmError: setConfirmError,
      setFloorValidationError: setFloorValidationError,
    });
  }, [matchFormat, completedSets, floorCurrentSets, editedCompletedSetIndicesRef, setState, setConfirmError, setFloorValidationError]);

  const resetState = useCallback(() => {
    setState({
      ...createInitialEditScoreState(currentServer, matchFormat),
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
  }, [currentServer, completedSets, initializedRef, matchFormat, setState, setConfirmError, setFloorValidationError]);

  return { openEditCompletedSet, resetState };
}
