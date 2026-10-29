'use client';

import React from 'react';

export type BannerKind = 'NO_SIGNAL' | 'PAUSED' | 'OFFLINE';

interface Props {
  kind: BannerKind;
  ageSeconds?: number | null;
  lastUpdated?: Date | null;
}

function formatTime(d?: Date | null): string {
  if (!d) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SpectatorStatusBanner({ kind, ageSeconds, lastUpdated }: Props) {
  if (kind === 'NO_SIGNAL') {
    const sec = ageSeconds ?? 30;
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
        <svg className="w-4 h-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Sem atualização há {sec} s. O placar pode estar atrasado.</span>
      </div>
    );
  }

  if (kind === 'PAUSED') {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-telemetry-base/90 border border-telemetry-border/20 text-telemetry-text-muted text-xs">
        <svg className="w-4 h-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
        </svg>
        <span>Pausada pelo anotador. Volta quando retomar.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-telemetry-base/90 border border-telemetry-border/20 text-telemetry-text-muted text-xs">
      <svg className="w-4 h-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
      </svg>
      <span>Você está sem internet. Mostrando dados de {formatTime(lastUpdated)}.</span>
    </div>
  );
}

