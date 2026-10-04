import React, { useRef, useEffect } from 'react';
import type { TennisFormat } from '@/core/scoring/types';
import { EditScoreTiebreakInputs } from './edit-score-tiebreak-inputs';
import { EditScoreGamePoints } from './edit-score-game-points';

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

  const getStatusMessage = () => {
    if (!p1Input && !p2Input) return null;

    const p1Num = parseInt(p1Input, 10);
    const p2Num = parseInt(p2Input, 10);
    const winner = p1Num > p2Num ? playerNames.p1 : playerNames.p2;

    if (isMatchTiebreakSet) {
      if (isSetTrulyCompleted) {
        return `${winner} venceu o match tiebreak — partida encerrada`;
      }
      return null;
    }

    if (isSetTrulyCompleted) {
      return `${winner} venceu o set`;
    }

    return `Set ${totalEditedSets + 1} em andamento — informe os games`;
  };

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

  const tbAt = matchFormat === 'PRO_SET_8' ? 9 : matchFormat === 'SHORT_SET_2V2_NO_AD' ? 4 : 6;
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

      <div className="flex items-center gap-2">
        <span className="text-xs text-telemetry-text-muted w-16 truncate flex items-center gap-1">
          {currentServer === 'player1' && (
            <span
              className="w-2 h-2 rounded-full bg-telemetry-volt flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.6)]"
              aria-label="Sacando"
            />
          )}
          {playerNames.p1}
        </span>
        <input
          type="number"
          className={`w-16 text-center bg-telemetry-elevated border rounded-lg px-2 py-1.5 text-telemetry-text-primary text-sm font-space-grotesk focus:outline-none focus:ring-2 focus:ring-telemetry-volt ${
            p1Input && p2Input && p1Val > p2Val
              ? 'border-telemetry-volt'
              : 'border-white/10'
          }`}
          value={p1Input}
          onChange={(e) => onP1InputChange(e.target.value)}
          placeholder="0"
          ref={p1InputRef}
          max={isMatchTiebreakSet ? 30 : matchFormat === 'PRO_SET_8' ? 10 : 7}
        />
        <span className="text-telemetry-text-muted text-xs font-space-grotesk">×</span>
        <input
          type="number"
          className={`w-16 text-center bg-telemetry-elevated border rounded-lg px-2 py-1.5 text-telemetry-text-primary text-sm font-space-grotesk focus:outline-none focus:ring-2 focus:ring-telemetry-volt ${
            p1Input && p2Input && p2Val > p1Val
              ? 'border-telemetry-volt'
              : 'border-white/10'
          }`}
          value={p2Input}
          onChange={(e) => onP2InputChange(e.target.value)}
          placeholder="0"
          max={isMatchTiebreakSet ? 30 : matchFormat === 'PRO_SET_8' ? 10 : 7}
        />
        <span className="text-xs text-telemetry-text-muted w-16 truncate text-right flex items-center justify-end gap-1">
          {playerNames.p2}
          {currentServer === 'player2' && (
            <span
              className="w-2 h-2 rounded-full bg-telemetry-volt flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.6)]"
              aria-label="Sacando"
            />
          )}
        </span>
      </div>

      {floorValidationError && (
        <p className="text-xs text-red-400">{floorValidationError}</p>
      )}

      {currentScoreBelowOriginal && (
        <p className="text-xs text-red-400">
          Placar não pode ser inferior ao registrado no momento do abandono
        </p>
      )}

      {isTiebreakInputVisible && (
        <EditScoreTiebreakInputs
          playerNames={playerNames}
          currentServer={currentServer}
          tiebreakP1={tiebreakP1}
          tiebreakP2={tiebreakP2}
          tiebreakComplete={tiebreakComplete}
          tiebreakImpossible={tiebreakImpossible}
          onTiebreakInputChange={onTiebreakInputChange}
        />
      )}

      {hasTiebreak && p1Input && p2Input && isSetTrulyCompleted && !tiebreakComplete && (
        <p className="text-xs text-amber-400">
          Tiebreak necessário - informe os pontos para completar o set
        </p>
      )}

      {p1Input && p2Input && validationError && (
        <p className="text-xs text-red-400 mt-1">{validationError}</p>
      )}

      {p1Input && p2Input && !validationError && (
        <p
          className={`text-xs ${isSetTrulyCompleted ? 'text-green-400' : 'text-amber-400'}`}
        >
          {getStatusMessage()}
        </p>
      )}

      {isSetTrulyCompleted && !matchWouldEnd && !isMatchOver && (
        <button
          type="button"
          onClick={onConfirmSet}
          disabled={!canConfirmSet}
          className="w-full mt-2 px-4 py-2.5 bg-telemetry-blue text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm text-sm"
        >
          Confirmar Set {totalEditedSets + 1}
        </button>
      )}

      {isSetTrulyCompleted && matchWouldEnd && (
        <div className="bg-telemetry-volt/10 border border-telemetry-volt/30 rounded-lg px-3 py-3 mt-2">
          <p className="text-sm font-semibold text-telemetry-volt flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Partida encerrada — confirmar para finalizar
          </p>
          <p className="text-xs text-telemetry-volt mt-1 opacity-80">
            {p1Val > p2Val ? playerNames.p1 : playerNames.p2} venceu por {p1SetsWon}-{p2SetsWon} sets
          </p>
        </div>
      )}

      {partial &&
        floorCurrentSets &&
        (p1Val < floorCurrentSets.player1 || p2Val < floorCurrentSets.player2) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-2">
            <p className="text-xs text-amber-300">
              Ponto de parada: {floorCurrentSets.player1}x{floorCurrentSets.player2} — placar não pode ser inferior a este valor.
            </p>
          </div>
        )}

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
    </div>
  );
}