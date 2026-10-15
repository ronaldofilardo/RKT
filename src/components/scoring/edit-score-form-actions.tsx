'use client';

import type { ReactNode } from 'react';

interface EditScoreFormActionsProps {
  children?: ReactNode;
  isSetTrulyCompleted: boolean;
  matchWouldEnd: boolean;
  isMatchOver: boolean;
  canConfirmSet: boolean;
  totalEditedSets: number;
  onConfirmSet: () => void;
  p1Val: number;
  p2Val: number;
  playerNames: { p1: string; p2: string };
  p1SetsWon: number;
  p2SetsWon: number;
  partial: boolean;
  floorCurrentSets: { player1: number; player2: number } | null;
}

/** Ações e avisos finais: confirmar set, encerramento da partida, ponto de parada e (filho) game points. */
export function EditScoreFormActions({
  children,
  isSetTrulyCompleted,
  matchWouldEnd,
  isMatchOver,
  canConfirmSet,
  totalEditedSets,
  onConfirmSet,
  p1Val,
  p2Val,
  playerNames,
  p1SetsWon,
  p2SetsWon,
  partial,
  floorCurrentSets,
}: EditScoreFormActionsProps) {
  return (
    <>
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

      {children}
    </>
  );
}
