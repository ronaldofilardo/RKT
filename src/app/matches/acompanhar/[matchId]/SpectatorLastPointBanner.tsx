'use client';

import React from 'react';
import { describeSpectatorPoint } from '@/core/spectate/point-labels';
import type { SpectatorPoint, SpectatorRhythmState } from '@/core/spectate/types';

export function SpectatorLastPointBanner({
  lastPoint,
  winnerName,
  rhythm,
}: {
  lastPoint?: SpectatorPoint | null;
  winnerName?: string;
  rhythm?: SpectatorRhythmState | null;
}) {
  if (!lastPoint) {
    return (
      <div className="bg-sky-950/50 border border-sky-500/20 text-sky-300 rounded-lg px-3 py-2 text-[13px]">
        Aguardando o primeiro ponto da partida...
      </div>
    );
  }

  const desc = describeSpectatorPoint(lastPoint.type);
  const rhythmNotice = rhythm?.label ? ` · ${rhythm.label}` : '';

  return (
    <div
      key={lastPoint.id}
      className="bg-sky-950/50 border border-sky-500/20 text-sky-300 rounded-lg px-3 py-2 text-[13px] font-medium flex items-center justify-between gap-2"
    >
      <span className="truncate">
        Último ponto · {winnerName || 'Atleta'} · {desc}{rhythmNotice}
      </span>
      <span className="relative flex h-2 w-2 shrink-0" title="Ao vivo">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-telemetry-volt opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-telemetry-volt" />
      </span>
    </div>
  );
}
