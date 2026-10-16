'use client';

import { useMemo } from 'react';
import type { CompletedSet } from './edit-score-logic';
import type { EditScoreModalProps } from './edit-score-modal.types';
import { useEditScoreModal } from './useEditScoreModal';

/** Liga o hook de estado do modal à derivação do floor de tiebreak efetivo. */
export function useEditScoreModalView({
  isOpen,
  matchFormat,
  playerNames,
  currentSets,
  currentServer,
  initialServer,
  completedSets = [],
  currentGamePoints,
  isTiebreak = false,
  floorCurrentSets = null,
  floorTiebreak,
  onConfirm,
  onCancel,
  onMatchFinished,
  onRefreshFloor,
}: EditScoreModalProps) {
  const effectiveFloorTiebreak = useMemo(() => {
    if (floorTiebreak !== undefined) return floorTiebreak;
    if (isTiebreak && currentGamePoints) {
      return {
        player1: Number(currentGamePoints.player1) || 0,
        player2: Number(currentGamePoints.player2) || 0,
      };
    }
    return null;
  }, [floorTiebreak, isTiebreak, currentGamePoints]);

  const {
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
    handlePointsChange,
    handleEditCompletedSet,
    handleConfirmSet,
    canConfirmSet,
  } = useEditScoreModal(
    {
      isOpen,
      matchFormat,
      currentSets,
      currentServer,
      initialServer,
      completedSets: completedSets as CompletedSet[],
      currentGamePoints,
      isTiebreak,
      floorCurrentSets,
      floorTiebreak: effectiveFloorTiebreak,
      onRefreshFloor,
      playerNames,
    },
    onConfirm,
    onCancel,
    onMatchFinished
  );

  return {
    effectiveFloorTiebreak,
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
    handlePointsChange,
    handleEditCompletedSet,
    handleConfirmSet,
    canConfirmSet,
  };
}
