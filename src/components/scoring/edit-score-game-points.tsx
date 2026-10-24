import React, { useEffect } from 'react';
import { pointToProgress, toDisplayPoint } from '@/core/scoring/point.logic';
import { GamePointsSelect } from './edit-score-game-points-select';

interface EditScoreGamePointsProps {
  playerNames: { p1: string; p2: string };
  currentServer?: 'player1' | 'player2';
  p1Points: string;
  p2Points: string;
  minP1Progress?: number;
  minP2Progress?: number;
  onP1PointsChange: (value: string) => void;
  onP2PointsChange: (value: string) => void;
}

export function EditScoreGamePoints({
  playerNames,
  currentServer,
  p1Points,
  p2Points,
  minP1Progress = 0,
  minP2Progress = 0,
  onP1PointsChange,
  onP2PointsChange,
}: EditScoreGamePointsProps) {
  useEffect(() => {
    if (minP1Progress > 0 && pointToProgress(p1Points) < minP1Progress) {
      onP1PointsChange(toDisplayPoint(minP1Progress));
    }
  }, [minP1Progress, p1Points, onP1PointsChange]);

  useEffect(() => {
    if (minP2Progress > 0 && pointToProgress(p2Points) < minP2Progress) {
      onP2PointsChange(toDisplayPoint(minP2Progress));
    }
  }, [minP2Progress, p2Points, onP2PointsChange]);

  return (
    <div className="space-y-2 pt-2 border-t border-white/5">
      <p className="text-xs font-semibold text-telemetry-text-muted">
        Pontos no Game Atual
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1">
        <GamePointsSelect
          playerName={playerNames.p1}
          isServing={currentServer === 'player1'}
          points={p1Points}
          opponentPoints={p2Points}
          minProgress={minP1Progress}
          onChange={onP1PointsChange}
        />

        <span className="text-telemetry-text-muted text-sm font-space-grotesk opacity-40 self-end mb-2">
          ×
        </span>

        <GamePointsSelect
          playerName={playerNames.p2}
          isServing={currentServer === 'player2'}
          points={p2Points}
          opponentPoints={p1Points}
          minProgress={minP2Progress}
          onChange={onP2PointsChange}
        />
      </div>
    </div>
  );
}
