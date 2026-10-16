import React from 'react';
import { GAME_POINTS } from '@/core/scoring/point.logic';

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
    <div className="space-y-2 pt-2 border-t border-white/5">
      <p className="text-xs font-semibold text-telemetry-text-muted">
        Pontos no Game Atual
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
          <select
            className="w-20 text-center bg-telemetry-elevated border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-telemetry-volt"
            value={p1Points}
            onChange={(e) => onP1PointsChange(e.target.value)}
            aria-label={`Pontos ${playerNames.p1}`}
          >
            {GAME_POINTS.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
            {(p2Points === '40' || p2Points === 'DEUCE') && (
              <>
                <option value="DEUCE">Deuce</option>
                <option value="AD">Adv.</option>
              </>
            )}
          </select>
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
          <select
            className="w-20 text-center bg-telemetry-elevated border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-telemetry-volt"
            value={p2Points}
            onChange={(e) => onP2PointsChange(e.target.value)}
            aria-label={`Pontos ${playerNames.p2}`}
          >
            {GAME_POINTS.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
            {(p1Points === '40' || p1Points === 'DEUCE') && (
              <>
                <option value="DEUCE">Deuce</option>
                <option value="AD">Adv.</option>
              </>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
