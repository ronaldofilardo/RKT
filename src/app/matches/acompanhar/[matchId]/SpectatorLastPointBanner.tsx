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
    <div className="bg-sky-950/50 border border-sky-500/20 text-sky-300 rounded-lg px-3 py-2 text-[13px] font-medium">
      Último ponto · {winnerName || 'Atleta'} · {desc}{rhythmNotice}
    </div>
  );
}
