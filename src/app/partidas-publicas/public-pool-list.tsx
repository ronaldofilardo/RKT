'use client';

import { PublicMatchCard } from './public-match-card';
import type { PublicPoolMatch } from './public-match-pool.logic';

interface PublicPoolListProps {
  matches: PublicPoolMatch[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  annotatingId: string | null;
  onAnnotate: (match: PublicPoolMatch) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

export function PublicPoolList({
  matches,
  loading,
  loadingMore,
  error,
  hasMore,
  annotatingId,
  onAnnotate,
  onLoadMore,
  onRetry,
}: PublicPoolListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48" role="status" aria-live="polite">
        <p className="text-telemetry-text-primary font-semibold">Carregando partidas públicas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-telemetry-card p-4 space-y-3" role="alert">
        <p className="text-telemetry-text-primary">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-telemetry-text-primary"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-telemetry-card p-6 text-center text-telemetry-text-muted">
        Nenhuma partida pública encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {matches.map((match) => (
          <li key={match.id}>
            <PublicMatchCard
              match={match}
              annotating={annotatingId === match.id}
              onAnnotate={onAnnotate}
            />
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-telemetry-text-primary disabled:opacity-60"
        >
          {loadingMore ? 'Carregando...' : 'Carregar mais'}
        </button>
      )}
    </div>
  );
}
