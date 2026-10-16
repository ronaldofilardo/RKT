'use client';

import { useMemo } from 'react';
import type { CompletedSet } from './edit-score-logic';
import type { EditScoreModalContentProps, EditScoreModalProps } from './edit-score-modal.types';
import { useEditScoreModal } from './useEditScoreModal';
import { EditScoreModalFooter } from './EditScoreModalFooter';
import { EditScoreModalShell } from './edit-score-modal-shell';
import { EditScoreModalContent } from './edit-score-modal-content';

export function EditScoreModal({
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

  if (!isOpen) return null;

  return (
    <EditScoreModalShell isConfirming={isConfirming} matchFormat={matchFormat} onCancel={handleCancel}>
      <EditScoreModalContent
        matchFormat={matchFormat}
        playerNames={playerNames}
        currentServer={currentServer}
        completedSets={completedSets as CompletedSet[]}
        floorCurrentSets={floorCurrentSets}
        effectiveFloorTiebreak={effectiveFloorTiebreak}
        confirmError={confirmError}
        floorValidationError={floorValidationError}
        state={state}
        setState={setState as unknown as EditScoreModalContentProps['setState']}
        calculations={calculations}
        canConfirmSet={canConfirmSet}
        handlers={{
          handleGameInputChange,
          handleTiebreakInputChange,
          handlePointsChange,
          handleEditCompletedSet,
          handleConfirmSet,
        }}
      />

      <EditScoreModalFooter
        isConfirming={isConfirming}
        canConfirm={calculations.canConfirm}
        hasErrors={Boolean(confirmError || floorValidationError)}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </EditScoreModalShell>
  );
}
