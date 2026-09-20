"use client";

import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "./editScoreHelpers";
import { totalSetsForFormat } from "@/core/scoring/format-rules";
import type { CompletedSet } from "./edit-score-logic";
import { useEditScoreModal } from "./useEditScoreModal";
import { MatchSummary, EditableSetsSummary } from "./edit-score-summary";
import { SetInputForm } from "./edit-score-form";
import {
  getAllCompletedSets,
  computeCompletedSetValidationErrors,
  buildEditableCompletedSets,
} from "./edit-score-modal.helpers";
import { EditScoreModalFooter } from "./EditScoreModalFooter";

type Player = "player1" | "player2";

interface EditScoreModalProps {
  isOpen: boolean;
  matchFormat: TennisFormat;
  playerNames: { p1: string; p2: string };
  currentSets: { player1: number; player2: number };
  currentServer: Player;
  completedSets?: CompletedSet[];
  currentGamePoints?: { player1: number | string; player2: number | string };
  // Indica que currentGamePoints representa os pontos de um tie-break de
  // set já em andamento (e não os pontos de um game normal), para que o
  // modal pré-preencha o campo "Tie-Break" em vez de "Pontos no Game Atual".
  isTiebreak?: boolean;
  floorCurrentSets?: { player1: number; player2: number } | null;
  onConfirm: (setResults: SetEditData[], server: Player) => void | Promise<void>;
  onCancel: () => void;
  onMatchFinished?: (winner: "player1" | "player2") => void;
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
  completedSets = [],
  currentGamePoints,
  isTiebreak = false,
  floorCurrentSets = null,
  onConfirm,
  onCancel,
  onMatchFinished,
  onRefreshFloor,
}: EditScoreModalProps) {
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
      completedSets: completedSets as CompletedSet[],
      currentGamePoints,
      isTiebreak,
      floorCurrentSets,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onClick={isConfirming ? undefined : handleCancel}
        onKeyDown={(e) => {
          if (!isConfirming && (e.key === 'Escape' || e.key === 'Enter')) handleCancel();
        }}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {isConfirming && (
          <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center rounded-2xl">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-lg border border-gray-200">
              <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Salvando placar...</span>
            </div>
          </div>
        )}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Editar Placar</h2>
          <p className="text-sm text-gray-600 mt-1">
            Modo de jogo: Melhor de {totalSetsForFormat(matchFormat)} sets
          </p>
        </div>

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
        </div>

        <EditScoreModalFooter
          isConfirming={isConfirming}
          canConfirm={canConfirm}
          hasErrors={hasErrors}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}