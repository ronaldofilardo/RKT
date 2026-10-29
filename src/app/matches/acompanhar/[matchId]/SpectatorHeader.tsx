'use client';

import React from 'react';
import Link from 'next/link';
import type { SpectatorFeedStatus, SpectatorMatchMeta } from '@/core/spectate';

interface Props {
  match: SpectatorMatchMeta;
  status: SpectatorFeedStatus;
  updateText: string;
}

export function SpectatorHeader({ match, status, updateText }: Props) {
  const matchTitle = match.sides.map((s) => s.label).join(' × ');

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          aria-label="Voltar"
          className="text-telemetry-text-muted hover:text-telemetry-text-primary p-0.5 -ml-1 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <h1 className="font-medium text-[15px] flex-1 text-telemetry-text-primary truncate m-0">
          {matchTitle}
        </h1>

        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            status === 'NO_SIGNAL'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : status === 'FINISHED' || status === 'NOT_STARTED'
              ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
              : status === 'PAUSED'
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {status === 'NO_SIGNAL'
            ? 'Sem sinal'
            : status === 'FINISHED'
            ? 'Encerrada'
            : status === 'PAUSED'
            ? 'Pausada'
            : status === 'NOT_STARTED'
            ? 'Aguardando início'
            : 'Ao vivo'}
        </span>
      </div>

      <p className="text-[13px] text-telemetry-text-muted m-0 pl-6">
        {updateText}
      </p>
    </div>
  );
}
