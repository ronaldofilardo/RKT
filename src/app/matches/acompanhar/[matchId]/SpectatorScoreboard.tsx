'use client';

import React from 'react';
import type { SpectatorView } from '@/core/spectate';

export function SpectatorScoreboard({
  view,
  isDimmed,
}: {
  view: SpectatorView;
  isDimmed?: boolean;
}) {
  const { match, score } = view;
  const side1 = match.sides[0];
  const side2 = match.sides[1];
  const sets = score.sets.length > 0 ? score.sets : [{ player1: 0, player2: 0 }];

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `minmax(0, 1fr) ${sets.map(() => '26px').join(' ')} 38px`,
  };

  return (
    <div
      className={`relative bg-telemetry-base/60 border border-telemetry-border/10 rounded-xl px-3 py-1 transition-opacity ${
        isDimmed ? 'opacity-70' : 'opacity-100'
      }`}
    >
      {isDimmed && (
        <span className="absolute top-1.5 right-2 px-1.5 py-0.5 text-[9px] uppercase font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
          Último recebido
        </span>
      )}

      {/* Header colunas */}
      <div style={gridStyle} className="items-center gap-1 text-[12px] text-telemetry-text-muted py-1.5">
        <span />
        {sets.map((_, i) => (
          <span key={i} className="text-center font-medium">
            S{i + 1}
          </span>
        ))}
        <span className="text-center font-medium">Pts</span>
      </div>

      {/* Linha Atleta 1 */}
      <div style={gridStyle} className="items-center gap-1 text-sm py-2">
        <span className="font-medium text-telemetry-text-primary truncate">
          {side1.label}
        </span>
        {sets.map((s, i) => (
          <span key={i} className="text-center text-telemetry-text-primary">
            {s.player1}
          </span>
        ))}
        <span className="text-center font-medium text-telemetry-text-primary">
          {score.currentGame.player1}
        </span>
      </div>

      {/* Linha Atleta 2 */}
      <div style={gridStyle} className="items-center gap-1 text-sm py-2 border-t border-telemetry-border/10">
        <span className="text-telemetry-text-primary truncate">
          {side2.label}
        </span>
        {sets.map((s, i) => (
          <span key={i} className="text-center text-telemetry-text-primary">
            {s.player2}
          </span>
        ))}
        <span className="text-center text-telemetry-text-primary">
          {score.currentGame.player2}
        </span>
      </div>
    </div>
  );
}
