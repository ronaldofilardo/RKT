import React from 'react';
import { SCORING_LIMITS } from '@/lib/constants';

interface EditScoreTiebreakInputsProps {
  playerNames: { p1: string; p2: string };
  currentServer?: 'player1' | 'player2';
  tiebreakP1: string;
  tiebreakP2: string;
  tiebreakComplete: boolean;
  tiebreakImpossible: boolean;
  onTiebreakInputChange: (value: string, player: 'p1' | 'p2') => void;
}

export function EditScoreTiebreakInputs({
  playerNames,
  currentServer,
  tiebreakP1,
  tiebreakP2,
  tiebreakComplete,
  tiebreakImpossible,
  onTiebreakInputChange,
}: EditScoreTiebreakInputsProps) {
  return (
    <div className="space-y-1 pt-1">
      <p className="text-xs font-semibold text-telemetry-text-muted uppercase">
        Tie-Break
      </p>
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
          className="w-16 text-center bg-telemetry-elevated border border-white/10 rounded-lg px-2 py-1.5 text-telemetry-text-primary text-sm font-space-grotesk focus:outline-none focus:ring-2 focus:ring-telemetry-volt"
          value={tiebreakP1}
          onChange={(e) => onTiebreakInputChange(e.target.value, 'p1')}
          min={0}
          max={SCORING_LIMITS.TIEBREAK_INPUT_CAP}
          placeholder="0"
        />
        <span className="text-telemetry-text-muted text-xs">×</span>
        <input
          type="number"
          className="w-16 text-center bg-telemetry-elevated border border-white/10 rounded-lg px-2 py-1.5 text-telemetry-text-primary text-sm font-space-grotesk focus:outline-none focus:ring-2 focus:ring-telemetry-volt"
          value={tiebreakP2}
          onChange={(e) => onTiebreakInputChange(e.target.value, 'p2')}
          min={0}
          max={SCORING_LIMITS.TIEBREAK_INPUT_CAP}
          placeholder="0"
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
      {!tiebreakComplete && !tiebreakImpossible && (
        <p className="text-xs text-telemetry-text-muted mt-1">
          Informe o placar do tiebreak (ex.: 7x5).
        </p>
      )}
    </div>
  );
}
