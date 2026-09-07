"use client";

import type { TennisFormat } from "@/core/scoring/types";
import type { SetEditData } from "./editScoreHelpers";
import { validateSetResult } from "./editScoreHelpers";
import { totalSetsForFormat } from "@/core/scoring/format-rules";
import type { CompletedSet } from "./edit-score-logic";
import { useEditScoreModal } from "./useEditScoreModal";
import { MatchSummary, EditableSetsSummary } from "./edit-score-summary";
import { SetInputForm } from "./edit-score-form";

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
  onConfirm: (setResults: SetEditData[], server: Player) => void;
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
    isFinishingMatch,
    calculations,
    handleGameInputChange,
    handleConfirm,
    handleCancel,
    handlePointsChange,
    handleEditCompletedSet,
    handleFinishMatch,
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

  const allCompletedSets = [
    ...(state.editableCompletedSets.length > 0
      ? state.editableCompletedSets
      : completedSets.map((cs) => ({
          p1Games: cs.games.player1,
          p2Games: cs.games.player2,
          isPartial: false,
          tiebreakScore: cs.tiebreakScore,
        }))),
    ...state.newSets,
  ];

  // FIX #12: Calcular erros de validação para cada set completado editado
  const completedSetValidationErrors: Record<number, string> = {};
  allCompletedSets.forEach((s, idx) => {
    const v = validateSetResult({ p1Games: s.p1Games, p2Games: s.p2Games }, matchFormat);
    if (v.error && !v.isPartial) {
      completedSetValidationErrors[idx] = v.error;
    }
  });

  const editableCompletedSets = allCompletedSets.map((s, idx) => {
    let winner: Player | null = null;
    const hasValidationError = !!completedSetValidationErrors[idx];
    const isValidSet = !s.isPartial && !hasValidationError;

    if (isValidSet) {
      if (s.p1Games > s.p2Games) {
        winner = 'player1';
      } else if (s.p2Games > s.p1Games) {
        winner = 'player2';
      } else if (s.tiebreakScore) {
        winner = s.tiebreakScore.player1 > s.tiebreakScore.player2 ? 'player1' : 'player2';
      }
    }
    return {
      p1Games: s.p1Games,
      p2Games: s.p2Games,
      winner,
      index: idx,
      isPartial: s.isPartial,
      hasValidationError,
    };
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onClick={handleCancel}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter') handleCancel();
        }}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Editar Placar</h2>
          <p className="text-sm text-gray-600 mt-1">
            Modo de jogo: Melhor de {totalSetsForFormat(matchFormat)} sets
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {(confirmError || floorValidationError) && (
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
            onTiebreakP1Change={(v: string) => setState(prev => ({ ...prev, tiebreakP1: v }))}
            onTiebreakP2Change={(v: string) => setState(prev => ({ ...prev, tiebreakP2: v }))}
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          {isFinishingMatch ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleFinishMatch}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                Registrar encerramento
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm || !!confirmError || !!floorValidationError}
                className="flex-1 px-4 py-2.5 bg-sky-600 text-white font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}