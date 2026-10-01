import React from 'react';
import { GAME_POINTS } from '@/core/scoring/point-utils';

interface EditScoreGamePointsProps {
  playerNames: { p1: string; p2: string };
  currentServer?: 'player1' | 'player2';
  p1Points: string;
  p2Points: string;
  onP1PointsChange: (value: string) => void;
  onP2PointsChange: (value: string) => void;
}

export function EditScoreGamePoints({
  playerNames,
  currentServer,
  p1Points,
  p2Points,
  onP1PointsChange,
  onP2PointsChange,
}: EditScoreGamePointsProps) {
  return (
    <div className="space-y-1 pt-1">
      <p className="text-xs font-semibold text-telemetry-text-muted">
        Pontos no Game Atual
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-telemetry-text-muted w-16 truncate flex items-center gap-1">
          {currentServer === 'player1' && (
            <span
              className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"
              aria-label="Sacando"
            />
          )}
          {playerNames.p1}
        </span>
        <select
          className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={p1Points}
          onChange={(e) => onP1PointsChange(e.target.value)}
        >
          {GAME_POINTS.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
          {p2Points === '40' && (
            <>
              <option value="DEUCE">Deuce</option>
              <option value="AD">Adv.</option>
            </>
          )}
        </select>
        <span className="text-telemetry-text-muted text-xs">×</span>
        <select
          className="w-20 text-center bg-gray-700 border border-white/10 rounded-lg px-1 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={p2Points}
          onChange={(e) => onP2PointsChange(e.target.value)}
        >
          {GAME_POINTS.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
          {p1Points === '40' && (
            <>
              <option value="DEUCE">Deuce</option>
              <option value="AD">Adv.</option>
            </>
          )}
        </select>
        <span className="text-xs text-telemetry-text-muted w-16 truncate text-right flex items-center justify-end gap-1">
          {playerNames.p2}
          {currentServer === 'player2' && (
            <span
              className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0"
              aria-label="Sacando"
            />
          )}
        </span>
      </div>
    </div>
  );
}
