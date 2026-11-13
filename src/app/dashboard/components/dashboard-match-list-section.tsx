import type { ReactNode } from 'react';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import { DashboardEmptyState } from './dashboard-empty-state';

interface DashboardMatchListSectionProps {
  headingId: string;
  title: string;
  emptyMessage: string;
  matches: DashboardMatchPayload[];
  onBack: () => void;
  renderCard: (m: DashboardMatchPayload) => ReactNode;
  activeArea?: string | null;
  showEmptyState?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

const FALLBACK_ERROR = 'Não foi possível carregar as partidas.';

function ErrorBox({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-telemetry-text-primary">
      <p>{message || FALLBACK_ERROR}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 rounded-lg border border-telemetry-border/30 px-3 py-1.5 font-semibold text-telemetry-blue-light hover:bg-telemetry-elevated"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}

function LoadMoreButton({ loadingMore, onLoadMore }: { loadingMore?: boolean; onLoadMore: () => void }) {
  return (
    <div className="flex justify-center pt-1">
      <button
        type="button"
        onClick={onLoadMore}
        disabled={loadingMore}
        className="rounded-lg border border-telemetry-border/30 px-4 py-2 text-sm font-semibold text-telemetry-blue-light hover:bg-telemetry-elevated disabled:opacity-60"
      >
        {loadingMore ? 'Carregando...' : 'Carregar mais'}
      </button>
    </div>
  );
}

function SectionHeader({ headingId, title, onBack }: { headingId: string; title: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 id={headingId} className="text-xl font-bold text-telemetry-text-primary">{title}</h2>
      <button type="button" onClick={onBack} className="text-sm text-telemetry-blue-light hover:underline">
        Voltar para Início
      </button>
    </div>
  );
}

export function DashboardMatchListSection({
  headingId, title, emptyMessage, matches, onBack, renderCard,
  activeArea, showEmptyState, errorMessage, onRetry, hasMore, onLoadMore, loadingMore,
}: DashboardMatchListSectionProps) {
  // Só o `ok === true && matches.length === 0` autoriza o estado vazio.
  if (matches.length === 0) {
    return (
      <section aria-labelledby={headingId}>
        <SectionHeader headingId={headingId} title={title} onBack={onBack} />
        {errorMessage ? <ErrorBox message={errorMessage} onRetry={onRetry} />
          : showEmptyState && activeArea ? <DashboardEmptyState activeArea={activeArea} />
          : <p className="text-telemetry-text-muted text-center py-8">{emptyMessage}</p>}
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionHeader headingId={headingId} title={title} onBack={onBack} />
      <div className="space-y-3">
        {errorMessage && <ErrorBox message={errorMessage} onRetry={onRetry} />}
        {matches.map((m) => renderCard(m))}
        {hasMore && onLoadMore && <LoadMoreButton loadingMore={loadingMore} onLoadMore={onLoadMore} />}
      </div>
    </section>
  );
}
