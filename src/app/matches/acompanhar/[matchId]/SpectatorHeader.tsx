'use client';

import React from 'react';
import Link from 'next/link';
import type { SpectatorFeedStatus, SpectatorMatchMeta } from '@/core/spectate';
import { getMatchFormatDisplayLabel } from '@/app/gestor/club-matches.logic';

interface Props {
  match: SpectatorMatchMeta;
  status: SpectatorFeedStatus;
  updateText: string;
  /** Hide back button for embedded/floating surfaces */
  hideBack?: boolean;
}

export function SpectatorHeader({ match, status, updateText, hideBack = false }: Props) {
  const [side1, side2] = match.sides;
  const formatLabel = getMatchFormatDisplayLabel(match.format);

  return (
    <div className="space-y-2 border-b border-telemetry-border/10 pb-3">
      <div className="text-center">
        <p className="truncate font-mono text-base font-semibold">
          <span className="text-telemetry-text-primary">{side1.label}</span>
          <span className="text-telemetry-text-muted"> × </span>
          <span className="text-telemetry-volt">{side2.label}</span>
        </p>
        <p className="font-mono text-xs text-telemetry-text-muted">{formatLabel}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
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

        {!hideBack && (
          <Link
            href="/dashboard"
            aria-label="Voltar ao dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-telemetry-border/20 bg-telemetry-active px-2.5 py-1.5 font-mono text-xs font-semibold text-telemetry-text-primary transition-colors hover:border-telemetry-volt/40 hover:text-telemetry-volt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry-blue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Voltar
          </Link>
        )}
      </div>

      <p className="font-mono text-xs text-telemetry-text-muted text-center">
        {updateText}
      </p>
    </div>
  );
}
