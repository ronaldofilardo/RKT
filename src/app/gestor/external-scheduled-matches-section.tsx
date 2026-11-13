'use client';

import type { ClubMatchItem } from './types';
import { ExternalScheduledMatchRow } from './external-scheduled-match-row';

interface ExternalScheduledMatchesSectionProps {
  externalMatches: ClubMatchItem[];
  onAssignCoach?: (match: ClubMatchItem) => void;
  onAnnotate?: (match: ClubMatchItem) => void;
}

export function ExternalScheduledMatchesSection({
  externalMatches,
  onAssignCoach,
  onAnnotate,
}: ExternalScheduledMatchesSectionProps) {
  if (!externalMatches || externalMatches.length === 0) return null;

  return (
    <section aria-label="Partidas agendadas por outros" className="space-y-3 mb-6">
      <div>
        <h2 className="text-lg font-semibold text-telemetry-volt flex items-center gap-2">
          <span>📅</span>
          <span>Partidas agendadas por outros</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-telemetry-volt/20 text-telemetry-volt font-bold">
            {externalMatches.length}
          </span>
        </h2>
        <p className="text-xs text-telemetry-text-muted">
          Partidas criadas por treinadores ou clubes externos envolvendo atletas deste clube
        </p>
      </div>

      <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-volt/30 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/40 text-xs font-semibold text-telemetry-text-muted uppercase">
              <th className="px-4 py-3">Data / Hora</th>
              <th className="px-4 py-3">Confronto</th>
              <th className="px-4 py-3">Criado por</th>
              <th className="px-4 py-3">Formato</th>
              <th className="px-4 py-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-telemetry-border/20 text-sm">
            {externalMatches.map((m) => (
              <ExternalScheduledMatchRow
                key={m.id}
                match={m}
                onAssignCoach={onAssignCoach}
                onAnnotate={onAnnotate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
