'use client';

import { useMemo } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import type { SetEditData } from './editScoreHelpers';
import type { CompletedSet } from './edit-score-logic';
import { useEditScoreModal } from './useEditScoreModal';
import { MatchSummary, EditableSetsSummary } from './edit-score-summary';
import { SetInputForm } from './edit-score-form';
import {
  getAllCompletedSets,
  computeCompletedSetValidationErrors,
  buildEditableCompletedSets,
} from './edit-score-modal.helpers';
import { EditScoreModalFooter } from './EditScoreModalFooter';
import { EditScoreModalShell } from './edit-score-modal-shell';
import { EditScoreNoteField } from './edit-score-note-field';

type Player = 'player1' | 'player2';

interface EditScoreModalProps {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: Player;
  // Sacador do Game 1 de TODA a partida (fixo — normalmente derivado de
  // match.initialServerId). Usado como âncora para recalcular corretamente
  // o sacador do próximo set ao editar o placar. Se omitido, cai para
  // currentServer (comportamento anterior).
  initialServer?: Player;
  completedSets?: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  // Indica que currentGamePoints representa os pontos de um tie-break de
  // set já em andamento (e não os pontos de um game normal), para que o
  // modal pré-preencha o campo "Tie-Break" em vez de "Pontos no Game Atual".
  isTiebreak?: boolean;
  floorCurrentSets?: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  onConfirm: (setResults: SetEditData[], server: Player) => void | Promise<void>;
  onCancel: () => void;
  onMatchFinished?: (winner: 'player1' | 'player2') => void;
  suspendedSession?: {
    bankScoreState?: {
      sets?: Array<{
        player1: number;
        player2: number;
        isTiebreak: boolean;
        tiebreakScore?: { player1: number; player2: number } | null;
      }>;
    } | null;
  } | null;
  onRefreshFloor?: () => Promise<{ player1: number; player2: number } | null>;
}

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

  const { validation, tiebreakValidation, matchState, canConfirm, partial } = calculations;
  const { tiebreakComplete } = tiebreakValidation;
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

  if (!isOpen) return null;

  const hasErrors = Boolean(confirmError || floorValidationError);

  return (
    <EditScoreModalShell isConfirming={isConfirming} matchFormat={matchFormat} onCancel={handleCancel}>
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
          onEditSet={handleEditCompletedSet}
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
          tiebreakComplete={tiebreakComplete}
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
          onConfirmSet={handleConfirmSet}
          onP1InputChange={(v: string) => handleGameInputChange(v, (val: string) => setState(prev => ({ ...prev, p1Input: val })), 'p1', state.p2Input)}
          onP2InputChange={(v: string) => handleGameInputChange(v, (val: string) => setState(prev => ({ ...prev, p2Input: val })), 'p2', state.p1Input)}
          onP1PointsChange={(v: string) => handlePointsChange(v, state.p2Points)}
          onP2PointsChange={(v: string) => handlePointsChange(state.p1Points, v)}
          onTiebreakInputChange={handleTiebreakInputChange}
          currentScoreBelowOriginal={calculations.currentScoreBelowOriginal}
        />

        <EditScoreNoteField
          value={state.note ?? ''}
          onChange={(v) => setState((prev) => ({ ...prev, note: v }))}
        />
      </div>

      <EditScoreModalFooter
        isConfirming={isConfirming}
        canConfirm={canConfirm}
        hasErrors={hasErrors}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </EditScoreModalShell>
  );
}
