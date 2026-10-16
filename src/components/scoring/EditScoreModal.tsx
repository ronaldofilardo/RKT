'use client';

import type { CompletedSet } from './edit-score-logic';
import type { EditScoreModalContentProps, EditScoreModalProps } from './edit-score-modal.types';
import { useEditScoreModalView } from './use-edit-score-modal-view';
import { EditScoreModalFooter } from './EditScoreModalFooter';
import { EditScoreModalShell } from './edit-score-modal-shell';
import { EditScoreModalContent } from './edit-score-modal-content';

export function EditScoreModal(props: EditScoreModalProps) {
  const { isOpen, matchFormat, playerNames, currentServer, completedSets = [], floorCurrentSets = null } = props;
  const {
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
  } = useEditScoreModalView(props);

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
