'use client';

import { MatchSummary, EditableSetsSummary } from './edit-score-summary';
import { SetInputForm } from './edit-score-form';
import { EditScoreNoteField } from './edit-score-note-field';
import type { EditScoreModalContentProps } from './edit-score-modal.types';
import {
  getAllCompletedSets,
  computeCompletedSetValidationErrors,
  buildEditableCompletedSets,
} from './edit-score-modal.helpers';

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
  const { validation, tiebreakValidation, matchState, partial } = calculations;
  const { p1Val, p2Val, isSetTrulyCompleted, hasTiebreak, isMatchTiebreakSet } = validation;
  const { matchWouldEnd, totalEditedSets, setsToWin, p1SetsWon, p2SetsWon } = matchState;

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
        onEditSet={(index: number, p1: number, p2: number) => handlers.handleEditCompletedSet(index, p1, p2)}
        validationErrors={completedSetValidationErrors}
      />

      <MatchSummary
        p1SetsWon={p1SetsWon}
        p2SetsWon={p2SetsWon}
        setsToWin={setsToWin}
        playerNames={playerNames}
      />

      <SetInputForm
        matchFormat={matchFormat}
        totalEditedSets={totalEditedSets}
        currentServer={currentServer}
        playerNames={playerNames}
        p1Input={state.p1Input}
        p2Input={state.p2Input}
        p1Points={state.p1Points}
        p2Points={state.p2Points}
        tiebreakP1={state.tiebreakP1}
        tiebreakP2={state.tiebreakP2}
        floorCurrentSets={floorCurrentSets}
        floorTiebreak={effectiveFloorTiebreak}
        floorValidationError={floorValidationError}
        isMatchTiebreakSet={isMatchTiebreakSet}
        isPotentialMTSet={calculations.isPotentialMTSet}
        hasTiebreak={hasTiebreak}
        isSetTrulyCompleted={isSetTrulyCompleted}
        tiebreakComplete={tiebreakValidation.tiebreakComplete}
        tiebreakImpossible={tiebreakValidation.tiebreakImpossible}
        partial={!!partial}
        p1Val={p1Val}
        p2Val={p2Val}
        validationError={validation.setValidationError}
        matchAlreadyOver={matchState.matchAlreadyOver}
        matchWouldEnd={matchWouldEnd}
        p1SetsWon={p1SetsWon}
        p2SetsWon={p2SetsWon}
        maxSets={matchState.maxSets}
        showGamePointsAtZero={calculations.showGamePointsAtZero}
        canConfirmSet={canConfirmSet}
        onConfirmSet={handlers.handleConfirmSet}
        onP1InputChange={(v: string) =>
          handlers.handleGameInputChange(v, (val: string) => setState(prev => ({ ...prev, p1Input: val })), 'p1', state.p2Input)}
        onP2InputChange={(v: string) =>
          handlers.handleGameInputChange(v, (val: string) => setState(prev => ({ ...prev, p2Input: val })), 'p2', state.p1Input)}
        onP1PointsChange={(v: string) => handlers.handlePointsChange(v, state.p2Points)}
        onP2PointsChange={(v: string) => handlers.handlePointsChange(state.p1Points, v)}
        onTiebreakInputChange={handlers.handleTiebreakInputChange}
        currentScoreBelowOriginal={calculations.currentScoreBelowOriginal}
      />

      <EditScoreNoteField
        value={state.note ?? ''}
        onChange={(v) => setState((prev) => ({ ...prev, note: v }))}
      />
    </div>
  );
}
