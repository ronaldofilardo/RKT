import React from 'react';
import type { SpectatorFeedStatus } from '@/core/spectate';

export function SpectatorStatusBar({
  status,
  isClientOffline,
  lastUpdated,
}: {
  status: SpectatorFeedStatus;
  isClientOffline: boolean;
  lastUpdated: Date | null;
}) {
  const isLive = status === 'LIVE' || status === 'CATCH_UP';
  const isNoSignal = status === 'NO_SIGNAL';
  const isPaused = status === 'PAUSED';
  const isFinished = status === 'FINISHED';

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="flex items-center justify-between py-2 text-xs">
      <div className="flex items-center gap-2">
        {isLive && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AO VIVO
          </span>
        )}
        {isNoSignal && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
            SEM SINAL DO ANOTADOR
          </span>
        )}
        {isPaused && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/30">
            ANOTAÇÃO PAUSADA
          </span>
        )}
        {isFinished && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 font-semibold border border-zinc-500/30">
            ENCERRADA
          </span>
        )}
      </div>

      <div className="text-right text-[11px] text-telemetry-text-muted">
        {isClientOffline ? (
          <span className="text-amber-400 font-medium">Você está sem internet</span>
        ) : timeStr ? (
          <span>Atualizado às {timeStr}</span>
        ) : null}
      </div>
    </div>
  );
}

