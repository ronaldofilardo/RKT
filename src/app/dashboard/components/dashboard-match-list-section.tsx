import type { ReactNode } from 'react';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';

interface DashboardMatchListSectionProps {
  headingId: string;
  title: string;
  emptyMessage: string;
  matches: DashboardMatchPayload[];
  onBack: () => void;
  renderCard: (m: DashboardMatchPayload) => ReactNode;
}

/** Seção de lista de partidas: cabeçalho, link de volta, vazio e cards. */
export function DashboardMatchListSection({
  headingId,
  title,
  emptyMessage,
  matches,
  onBack,
  renderCard,
}: DashboardMatchListSectionProps) {
  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center justify-between mb-4">
        <h2 id={headingId} className="text-xl font-bold text-telemetry-text-primary">
          {title}
        </h2>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-telemetry-blue-light hover:underline"
        >
          Voltar para Início
        </button>
      </div>
      {matches.length === 0 ? (
        <p className="text-telemetry-text-muted text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">{matches.map((m) => renderCard(m))}</div>
      )}
    </section>
  );
}
