'use client';

import type { ExternalAthlete, ExternalClub } from './types';

interface ExternosClubsTableProps {
  clubs: ExternalClub[];
  athletes: ExternalAthlete[];
  total: number;
}

function clubStatusBadge(status: string | null, inSystem: boolean): React.ReactNode {
  if (!inSystem) {
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-telemetry-error/20 text-telemetry-error">Não cadastrado</span>;
  }
  const s = (status || '').toUpperCase();
  const variants: Record<string, string> = {
    PENDING: 'bg-telemetry-alert/20 text-telemetry-alert',
    ACTIVE: 'bg-telemetry-volt/20 text-telemetry-volt',
    SUSPENDED: 'bg-telemetry-error/20 text-telemetry-error',
  };
  const base = variants[s] ?? 'bg-telemetry-text-muted/20 text-telemetry-text-muted';
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    ACTIVE: 'Ativo',
    SUSPENDED: 'Suspenso',
  };
  const label = labels[s] ?? s;
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${base}`}>{label}</span>;
}

export function ExternosClubsTable({ clubs, athletes, total }: ExternosClubsTableProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">
        Clubes Mencionados ({total})
      </h3>
      <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Clube</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Cidade</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Estado</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Status</th>
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Atletas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-telemetry-border/20">
            {clubs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-telemetry-text-muted">
                  Nenhum clube externo mencionado.
                </td>
              </tr>
            ) : (
              clubs.map((c) => {
                const athleteCount = athletes.filter((a) => a.club === c.club).length;
                return (
                  <tr key={c.club} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
                    <td className="px-3 py-3 text-sm text-telemetry-text-primary">{c.club}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {c.city || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {c.state || '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">
                      {clubStatusBadge(c.status, c.inSystem)}
                    </td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted">{athleteCount}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}