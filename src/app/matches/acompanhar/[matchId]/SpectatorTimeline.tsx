'use client';

import React from 'react';
import type { SpectatorPoint } from '@/core/spectate';

export function SpectatorTimeline({
  points,
  side1Label,
  side2Label,
}: {
  points: SpectatorPoint[];
  side1Label: string;
  side2Label: string;
}) {
  if (points.length === 0) {
    return (
      <div className="text-center py-8 text-telemetry-text-muted text-[13px]">
        Nenhum ponto registrado até o momento.
      </div>
    );
  }

  const reversed = [...points].reverse();

  return (
    <div className="flex flex-col">
      {reversed.map((p) => {
        const winnerName = p.winnerSide === 'side1' ? side1Label : side2Label;
        const desc = p.type.toLowerCase();
        return (
          <div
            key={p.id}
            className="flex items-baseline gap-2.5 py-2 border-t border-telemetry-border/10 first:border-t-0 text-[13px]"
          >
            <span className="text-telemetry-text-muted font-mono text-xs min-w-[56px] flex-none">
              G{p.gameNumber} · {p.scoreAfter}
            </span>
            <span className="text-telemetry-text-primary truncate">
              {winnerName} · {desc}
            </span>
          </div>
        );
      })}
    </div>
  );
}
