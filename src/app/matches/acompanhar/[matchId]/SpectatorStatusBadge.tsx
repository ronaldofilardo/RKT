'use client';

import type { SpectatorFeedStatus } from '@/core/spectate';

/** Badge de status do feed do espectador (ao vivo, pausada, sinal etc.). */
export function SpectatorStatusBadge({ status }: { status: SpectatorFeedStatus }) {
  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
        status === 'NO_SIGNAL'
          ? 'bg-telemetry-alert/10 text-telemetry-alert border border-telemetry-alert/20'
          : status === 'FINISHED' || status === 'NOT_STARTED'
          ? 'bg-telemetry-elevated text-telemetry-text-muted border border-telemetry-border/20'
          : status === 'PAUSED'
          ? 'bg-telemetry-blue/10 text-telemetry-blue border border-telemetry-blue/20'
          : 'bg-telemetry-error/10 text-telemetry-error border border-telemetry-error/20'
      }`}
    >
      {status === 'NO_SIGNAL' && (
        <>
          <span
            className="h-1.5 w-1.5 rounded-full bg-telemetry-alert"
            style={{ animation: 'pillar-pulse 1.4s ease-in-out infinite' }}
            aria-hidden="true"
          />
          Sem sinal
        </>
      )}
      {status === 'FINISHED' && <span>Encerrada</span>}
      {status === 'NOT_STARTED' && <span>Aguardando início</span>}
      {status === 'PAUSED' && <span>Pausada</span>}
      {status === 'LIVE' && (
        <>
          <span
            className="h-1.5 w-1.5 rounded-full bg-telemetry-error"
            style={{ animation: 'pillar-pulse 1.4s ease-in-out infinite' }}
            aria-hidden="true"
          />
          Ao vivo
        </>
      )}
    </span>
  );
}
