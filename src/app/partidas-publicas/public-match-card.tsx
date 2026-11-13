'use client';

import {
  formatPoolDate,
  poolFormatLabel,
  type PublicPoolMatch,
} from './public-match-pool.logic';

function playerLabel(player: { name: string; nickname?: string | null }): string {
  return player.nickname ? `${player.name} (@${player.nickname})` : player.name;
}

interface PublicMatchCardProps {
  match: PublicPoolMatch;
  annotating: boolean;
  onAnnotate: (match: PublicPoolMatch) => void;
}

export function PublicMatchCard({ match, annotating, onAnnotate }: PublicMatchCardProps) {
  const meta = [
    match.tournamentName,
    match.clubName,
    match.category,
    match.round,
  ].filter(Boolean) as string[];

  return (
    <article className="rounded-xl border border-white/10 bg-telemetry-card p-4 space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-telemetry-text-primary">
            {playerLabel(match.player1)} <span className="text-telemetry-text-muted">×</span>{' '}
            {playerLabel(match.player2)}
          </h3>
          <p className="text-xs text-telemetry-text-muted">
            {poolFormatLabel(match.format)} · {match.courtType ?? 'Quadra a definir'} ·{' '}
            {match.matchType === 'DOUBLES' ? 'Duplas' : 'Simples'}
          </p>
        </div>
        <span className="rounded-full border border-telemetry-volt/40 px-3 py-1 text-xs font-semibold text-telemetry-volt">
          {match.annotationCount} {match.annotationCount === 1 ? 'anotação' : 'anotações'}
        </span>
      </header>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-telemetry-text-muted">
        <div>
          <dt className="inline font-semibold text-telemetry-text-primary">Data: </dt>
          <dd className="inline">{formatPoolDate(match.scheduledAt)}</dd>
        </div>
        {meta.length > 0 && (
          <div>
            <dt className="inline font-semibold text-telemetry-text-primary">Evento: </dt>
            <dd className="inline">{meta.join(' · ')}</dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        onClick={() => onAnnotate(match)}
        disabled={annotating}
        className="w-full rounded-lg bg-telemetry-volt px-4 py-2 font-semibold text-telemetry-base disabled:opacity-60"
      >
        {annotating
          ? 'Preparando anotação...'
          : match.myAnnotationId
            ? 'Continuar minha anotação'
            : 'Anotar esta partida'}
      </button>
    </article>
  );
}
