'use client';

import type { CompletedSet } from '@/core/scoring/edit-score-state';
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
    updateGameInputValue,
    updateTiebreakInputValue,
    confirmCurrentAction,
    cancelCurrentAction,
    updatePointTotals,
    openEditCompletedSet,
    commitSetScore,
    canConfirmSet,
  } = useEditScoreModalView(props);

  if (!isOpen) return null;

  return (
    <EditScoreModalShell isConfirming={isConfirming} matchFormat={matchFormat} onCancel={cancelCurrentAction}>
      <EditScoreModalContent
        matchFormat={matchFormat}
        playerNames={playerNames}
        currentServer={currentServer}
        completedSets={completedSets as CompletedSet[]}
        floorCurrentSets={floorCurrentSets}
        effectiveFloorTiebreak={effectiveFloorTiebreak}
        confirmError={confirmError}
        floorValidationError={floorValidationError}
        doubles={props.doubles}
        state={state}
        setState={setState as unknown as EditScoreModalContentProps['setState']}
        calculations={calculations}
        canConfirmSet={canConfirmSet}
        handlers={{
          updateGameInputValue,
          updateTiebreakInputValue,
          updatePointTotals,
          openEditCompletedSet,
          commitSetScore,
        }}
      />

      <EditScoreModalFooter
        isConfirming={isConfirming}
        canConfirm={calculations.canConfirm}
        hasErrors={Boolean(confirmError || floorValidationError)}
        onCancel={cancelCurrentAction}
        onConfirm={confirmCurrentAction}
      />
    </EditScoreModalShell>
  );
}
