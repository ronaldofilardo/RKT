'use client';

import React from 'react';
import Link from 'next/link';
import type { SpectatorFeedStatus, SpectatorMatchMeta } from '@/core/spectate';
import { getMatchFormatDisplayLabel } from '@/app/gestor/club-matches.logic';
import { SpectatorStatusBadge } from './SpectatorStatusBadge';

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
        {side1.label.includes(' / ') || side2.label.includes(' / ') ? (
          <div className="space-y-0.5 font-sans tabular-nums text-sm font-semibold leading-snug">
            <p className="break-words text-telemetry-text-primary">{side1.label}</p>
            <p className="text-xs text-telemetry-text-muted">×</p>
            <p className="break-words text-telemetry-volt">{side2.label}</p>
          </div>
        ) : (
          <p className="truncate font-sans tabular-nums text-base font-semibold">
            <span className="text-telemetry-text-primary">{side1.label}</span>
            <span className="text-telemetry-text-muted"> × </span>
            <span className="text-telemetry-volt">{side2.label}</span>
          </p>
        )}
        <p className="font-sans tabular-nums text-xs text-telemetry-text-muted">{formatLabel}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <SpectatorStatusBadge status={status} />

        {!hideBack && (
          <Link
            href="/dashboard"
            aria-label="Voltar ao dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-telemetry-border/20 bg-telemetry-active px-2.5 py-1.5 font-sans tabular-nums text-xs font-semibold text-telemetry-text-primary transition-colors hover:border-telemetry-volt/40 hover:text-telemetry-volt focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-telemetry-blue"
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

      <p className="font-sans tabular-nums text-xs text-telemetry-text-muted text-center">
        {updateText}
      </p>
    </div>
  );
}
