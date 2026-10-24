import React from 'react';
import { GAME_POINTS, pointToProgress } from '@/core/scoring/point.logic';

interface GamePointsSelectProps {
  playerName: string;
  isServing?: boolean;
  points: string;
  opponentPoints: string;
  minProgress?: number;
  onChange: (value: string) => void;
}

export function GamePointsSelect({
  playerName,
  isServing,
  points,
  opponentPoints,
  minProgress = 0,
  onChange,
}: GamePointsSelectProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-0">
      <div className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-telemetry-text-primary px-1">
        {isServing && (
          <span
            className="w-2 h-2 rounded-full bg-telemetry-volt flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.6)]"
            aria-label="Sacando"
            title="Sacando"
          />
        )}
        <span className="truncate text-center" title={playerName}>
          {playerName}
        </span>
      </div>
      <select
        className="w-20 text-center bg-telemetry-elevated border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-telemetry-volt"
        value={points}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Pontos ${playerName}`}
      >
        {GAME_POINTS.filter((pt) => pointToProgress(pt) >= minProgress).map((pt) => (
          <option key={pt} value={pt}>
            {pt}
          </option>
        ))}
        {(opponentPoints === '40' || opponentPoints === 'DEUCE') && (
          <>
            {pointToProgress('DEUCE') >= minProgress && (
              <option value="DEUCE">Deuce</option>
            )}
            {pointToProgress('AD') >= minProgress && (
              <option value="AD">Adv.</option>
            )}
          </>
        )}
      </select>
    </div>
  );
}
