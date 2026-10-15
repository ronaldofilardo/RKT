import React, { useRef, useEffect } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import { EditScoreTiebreakInputs } from './edit-score-tiebreak-inputs';
import { EditScoreGamePoints } from './edit-score-game-points';
import { EditScoreGamesGrid } from './edit-score-games-grid';
import { EditScoreFormErrors, EditScoreFormFeedback } from './edit-score-form-feedback';
import { EditScoreFormActions } from './edit-score-form-actions';

export interface SetInputFormProps {
  matchFormat: TennisFormat;
  totalEditedSets: number;
  currentServer: 'player1' | 'player2';
  playerNames: { p1: string; p2: string };
  p1Input: string;
  p2Input: string;
  p1Points: string;
  p2Points: string;
  tiebreakP1: string;
  tiebreakP2: string;
  floorCurrentSets: { player1: number; player2: number } | null;
  floorTiebreak?: { player1: number; player2: number } | null;
  floorValidationError: string | null;
  isMatchTiebreakSet: boolean;
  isPotentialMTSet: boolean;
  hasTiebreak: boolean;
  isSetTrulyCompleted: boolean;
  tiebreakComplete: boolean;
  tiebreakImpossible: boolean;
  partial: boolean;
  p1Val: number;
  p2Val: number;
  validationError?: string;
  onP1InputChange: (value: string) => void;
  onP2InputChange: (value: string) => void;
  onP1PointsChange: (value: string) => void;
  onP2PointsChange: (value: string) => void;
  onTiebreakInputChange: (value: string, player: 'p1' | 'p2') => void;
  matchAlreadyOver: boolean;
  matchWouldEnd: boolean;
  p1SetsWon: number;
  p2SetsWon: number;
  maxSets: number;
  showGamePointsAtZero: boolean;
  canConfirmSet: boolean;
  onConfirmSet: () => void;
  currentScoreBelowOriginal?: boolean;
}

export function SetInputForm({
  matchFormat,
  totalEditedSets,
  currentServer,
  playerNames,
  p1Input,
  p2Input,
  p1Points,
  p2Points,
  tiebreakP1,
  tiebreakP2,
  floorCurrentSets,
  floorTiebreak,
  floorValidationError,
  isMatchTiebreakSet,
  isPotentialMTSet,
  hasTiebreak,
  isSetTrulyCompleted,
  tiebreakComplete,
  tiebreakImpossible,
  partial,
  p1Val,
  p2Val,
  validationError,
  onP1InputChange,
  onP2InputChange,
  onP1PointsChange,
  onP2PointsChange,
  onTiebreakInputChange,
  matchAlreadyOver,
  matchWouldEnd,
  p1SetsWon,
  p2SetsWon,
  maxSets,
  showGamePointsAtZero,
  canConfirmSet,
  onConfirmSet,
  currentScoreBelowOriginal,
}: SetInputFormProps) {
  const isMatchOver = matchAlreadyOver || totalEditedSets >= maxSets;
  const p1InputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    p1InputRef.current?.focus();
  }, []);

  // Don't show input form when match is already over
  if (isMatchOver) {
    return (
      <div className="space-y-3 rounded-lg bg-telemetry-card border border-white/10 p-4">
        <p className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wide">
          Partida Encerrada
        </p>
        <p className="text-xs text-telemetry-text-muted">
          A partida já foi finalizada. Não é possível adicionar novos sets.
        </p>
      </div>
    );
  }

  const tbAt = matchFormat === 'PRO_SET_8' ? 9 : 6;
  const isTiebreakInputVisible =
    !isMatchTiebreakSet &&
    hasTiebreak &&
    p1Input &&
    p2Input &&
    ((p1Val === tbAt && p2Val === tbAt) ||
      (p1Val === tbAt + 1 && p2Val === tbAt) ||
      (p1Val === tbAt && p2Val === tbAt + 1));

  return (
    <div className="space-y-4 rounded-lg bg-telemetry-card border border-white/10 p-4">
      {isMatchTiebreakSet ? (
        <p className="text-xs font-semibold text-telemetry-volt uppercase tracking-wide">
          Set {totalEditedSets + 1} — Match Tiebreak
        </p>
      ) : isPotentialMTSet ? (
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wide">
            Set {totalEditedSets + 1}
          </p>
          <span className="text-[10px] text-telemetry-alert bg-telemetry-alert/10 px-1.5 py-0.5 rounded">
            Pode virar MT em 6-6
          </span>
        </div>
      ) : (
        <p className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wide">
          Set {totalEditedSets + 1}
        </p>
      )}

      <EditScoreGamesGrid
        matchFormat={matchFormat}
        currentServer={currentServer}
        playerNames={playerNames}
        p1Input={p1Input}
        p2Input={p2Input}
        p1Val={p1Val}
        p2Val={p2Val}
        floorCurrentSets={floorCurrentSets}
        isMatchTiebreakSet={isMatchTiebreakSet}
        p1InputRef={p1InputRef}
        onP1InputChange={onP1InputChange}
        onP2InputChange={onP2InputChange}
      />

      <EditScoreFormErrors
        floorValidationError={floorValidationError}
        currentScoreBelowOriginal={currentScoreBelowOriginal}
      />

      {isTiebreakInputVisible && (
        <EditScoreTiebreakInputs
          playerNames={playerNames}
          currentServer={currentServer}
          tiebreakP1={tiebreakP1}
          tiebreakP2={tiebreakP2}
          tiebreakComplete={tiebreakComplete}
          tiebreakImpossible={tiebreakImpossible}
          floorTiebreak={floorTiebreak}
          onTiebreakInputChange={onTiebreakInputChange}
        />
      )}

      <EditScoreFormFeedback
        p1Input={p1Input}
        p2Input={p2Input}
        playerNames={playerNames}
        totalEditedSets={totalEditedSets}
        isMatchTiebreakSet={isMatchTiebreakSet}
        isSetTrulyCompleted={isSetTrulyCompleted}
        hasTiebreak={hasTiebreak}
        tiebreakComplete={tiebreakComplete}
        validationError={validationError}
      />

      <EditScoreFormActions
        isSetTrulyCompleted={isSetTrulyCompleted}
        matchWouldEnd={matchWouldEnd}
        isMatchOver={isMatchOver}
        canConfirmSet={canConfirmSet}
        totalEditedSets={totalEditedSets}
        onConfirmSet={onConfirmSet}
        p1Val={p1Val}
        p2Val={p2Val}
        playerNames={playerNames}
        p1SetsWon={p1SetsWon}
        p2SetsWon={p2SetsWon}
        partial={partial}
        floorCurrentSets={floorCurrentSets}
      >
        {(partial || showGamePointsAtZero) && !isMatchTiebreakSet && !hasTiebreak && (
          <EditScoreGamePoints
            playerNames={playerNames}
            currentServer={currentServer}
            p1Points={p1Points}
            p2Points={p2Points}
            onP1PointsChange={onP1PointsChange}
            onP2PointsChange={onP2PointsChange}
          />
        )}
      </EditScoreFormActions>
    </div>
  );
}