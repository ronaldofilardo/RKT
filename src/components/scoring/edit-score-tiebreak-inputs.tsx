import React from 'react';
import { SCORING_LIMITS } from '@/lib/constants';

interface EditScoreTiebreakInputsProps {
  playerNames: { p1: string; p2: string };
  currentServer?: 'player1' | 'player2';
  tiebreakP1: string;
  tiebreakP2: string;
  tiebreakComplete: boolean;
  tiebreakImpossible: boolean;
  floorTiebreak?: { player1: number; player2: number } | null;
  onTiebreakInputChange: (value: string, player: 'p1' | 'p2') => void;
}

export function EditScoreTiebreakInputs({
  playerNames,
  currentServer,
  tiebreakP1,
  tiebreakP2,
  tiebreakComplete,
  tiebreakImpossible,
  floorTiebreak,
  onTiebreakInputChange,
}: EditScoreTiebreakInputsProps) {
  return (
    <div className="space-y-2 pt-2 border-t border-white/5">
      <p className="text-xs font-semibold text-telemetry-text-muted uppercase">
        Tie-Break
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
        {/* Jogador 1 (sempre à esquerda) */}
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-telemetry-text-primary px-1">
            {currentServer === 'player1' && (
              <span
                className="w-2 h-2 rounded-full bg-telemetry-volt flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.6)]"
                aria-label="Sacando"
                title="Sacando"
              />
            )}
            <span className="truncate text-center" title={playerNames.p1}>
              {playerNames.p1}
            </span>
          </div>
          <input
            type="number"
            className="w-20 text-center bg-telemetry-elevated border border-white/10 rounded-lg px-2 py-1.5 text-telemetry-text-primary text-base font-space-grotesk focus:outline-none focus:ring-2 focus:ring-telemetry-volt"
            value={tiebreakP1}
            onChange={(e) => onTiebreakInputChange(e.target.value, 'p1')}
            min={floorTiebreak?.player1 ?? 0}
            max={SCORING_LIMITS.TIEBREAK_INPUT_CAP}
            placeholder="0"
            aria-label={`Tiebreak ${playerNames.p1}`}
          />
        </div>

        {/* Separador */}
        <span className="text-telemetry-text-muted text-sm font-space-grotesk opacity-40 self-end mb-2">×</span>

        {/* Jogador 2 (sempre à direita) */}
        <div className="flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-telemetry-text-primary px-1">
            <span className="truncate text-center" title={playerNames.p2}>
              {playerNames.p2}
            </span>
            {currentServer === 'player2' && (
              <span
                className="w-2 h-2 rounded-full bg-telemetry-volt flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.6)]"
                aria-label="Sacando"
                title="Sacando"
              />
            )}
          </div>
          <input
            type="number"
            className="w-20 text-center bg-telemetry-elevated border border-white/10 rounded-lg px-2 py-1.5 text-telemetry-text-primary text-base font-space-grotesk focus:outline-none focus:ring-2 focus:ring-telemetry-volt"
            value={tiebreakP2}
            onChange={(e) => onTiebreakInputChange(e.target.value, 'p2')}
            min={floorTiebreak?.player2 ?? 0}
            max={SCORING_LIMITS.TIEBREAK_INPUT_CAP}
            placeholder="0"
            aria-label={`Tiebreak ${playerNames.p2}`}
          />
        </div>
      </div>
      {!tiebreakComplete && !tiebreakImpossible && (
        <p className="text-xs text-center text-telemetry-text-muted mt-1">
          Informe o placar do tiebreak (ex.: 7x5).
        </p>
      )}
    </div>
  );
}
