'use client';

import { MatchSummary, EditableSetsSummary } from './edit-score-summary';
import { EditScoreNoteField } from './edit-score-note-field';
import { EditScoreSetInputSection } from './edit-score-set-input-section';
import type { EditScoreModalContentProps } from './edit-score-modal.types';
import {
  getAllCompletedSets,
  computeCompletedSetValidationErrors,
  buildEditableCompletedSets,
} from './edit-score-modal.logic';

/** Área rolável do modal: erros, sets completados, resumo, formulário e nota. */
export function EditScoreModalContent({
  matchFormat,
  playerNames,
  currentServer,
  completedSets,
  floorCurrentSets,
  effectiveFloorTiebreak,
  confirmError,
  floorValidationError,
  state,
  setState,
  calculations,
  canConfirmSet,
  handlers,
}: EditScoreModalContentProps) {
  const { matchState } = calculations;
  const { p1SetsWon, p2SetsWon, setsToWin } = matchState;

  const allCompletedSets = getAllCompletedSets(
    state.editableCompletedSets,
    completedSets,
    state.newSets
  );
  const completedSetValidationErrors = computeCompletedSetValidationErrors(
    allCompletedSets,
    matchFormat
  );
  const editableCompletedSets = buildEditableCompletedSets(
    allCompletedSets,
    completedSetValidationErrors
  );

  const hasErrors = Boolean(confirmError || floorValidationError);

  return (
    <div className="p-6 overflow-y-auto flex-1 space-y-5">
      {hasErrors && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {confirmError || floorValidationError}
        </div>
      )}

      <EditableSetsSummary
        title="Sets Completados"
        sets={editableCompletedSets}
        playerNames={playerNames}
        startIndex={0}
        onEditSet={(index: number, p1: number, p2: number) => handlers.openEditCompletedSet(index, p1, p2)}
        validationErrors={completedSetValidationErrors}
      />

      <MatchSummary
        p1SetsWon={p1SetsWon}
        p2SetsWon={p2SetsWon}
        setsToWin={setsToWin}
        playerNames={playerNames}
      />

      <EditScoreSetInputSection
        matchFormat={matchFormat}
        playerNames={playerNames}
        currentServer={currentServer}
        floorCurrentSets={floorCurrentSets}
        effectiveFloorTiebreak={effectiveFloorTiebreak}
        floorValidationError={floorValidationError}
        state={state}
        setState={setState}
        calculations={calculations}
        canConfirmSet={canConfirmSet}
        handlers={handlers}
      />

      <EditScoreNoteField
        value={state.note ?? ''}
        onChange={(v) => setState((prev) => ({ ...prev, note: v }))}
      />
    </div>
  );
}
