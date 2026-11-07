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
      <div className="flex items-center justify-between gap-3 border-b border-telemetry-border/10 px-4 py-2">
        <span className="shrink-0 font-mono text-sm text-telemetry-text-muted">
          Último ponto
        </span>
        <p className="truncate font-mono text-xs text-telemetry-text-muted">Aguardando pontos…</p>
      </div>
    );
  }

  const desc = describeSpectatorPoint(lastPoint.type);
  const rhythmNotice = rhythm?.label ? ` · ${rhythm.label}` : '';

  return (
    <div className="flex items-center justify-between gap-3 border-b border-telemetry-border/10 px-4 py-2">
      <span className="shrink-0 font-mono text-sm text-telemetry-text-muted">
        Último ponto
      </span>
      <p className="flex min-w-0 items-center justify-end gap-1.5 font-mono text-sm text-telemetry-text-primary">
        <span className="truncate">
          {winnerName || 'Atleta'} · {desc}{rhythmNotice}
        </span>
        <span
          className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-telemetry-volt"
          style={{ animation: 'pillar-pulse 1.4s ease-in-out infinite' }}
          aria-hidden="true"
          data-testid="live-pulse"
        />
      </p>
    </div>
  );
}
