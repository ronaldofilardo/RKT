'use client';

import type { ClubMatchItem } from './types';
import { ClubMatchRow } from './club-match-row';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';

interface ClubMatchesTableProps {
  matches: ClubMatchItem[];
  loading?: boolean;
}

export function ClubMatchesTable({ matches, loading }: ClubMatchesTableProps) {
  const floating = useFloatingSpectatorOptional();

  if (loading) {
    return <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
      <p className="text-telemetry-text-muted text-sm">Carregando partidas do clube...</p>
    </div>;
  }

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Partidas do Clube</h2>
        <p className="text-xs text-telemetry-text-muted">Partidas anotadas por treinadores ou disputadas por atletas do clube</p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
          <p className="text-telemetry-text-muted text-sm">Nenhuma partida registrada por treinadores ou atletas deste clube ainda.</p>
        </div>
      ) : (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Data</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Confronto</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Placar</th>
                <th className="hidden md:table-cell px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Formato</th>
                <th className="hidden md:table-cell px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Anotador / Criador</th>
                <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Status</th>
                <th className="px-3 pb-4 pt-4 text-right text-sm font-medium text-telemetry-text-primary">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-telemetry-border/20">
              {matches.map((m) => (
                <ClubMatchRow key={m.id} match={m} floating={floating} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}