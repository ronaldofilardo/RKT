'use client';

import type { ClubMatchItem } from './types';
import Link from 'next/link';

interface ClubMatchesTableProps {
  matches: ClubMatchItem[];
  loading?: boolean;
}

function getStateBadge(state: string) {
  if (state === 'FINISHED') return 'bg-telemetry-volt/20 text-telemetry-volt';
  if (state === 'IN_PROGRESS') return 'bg-telemetry-alert/20 text-telemetry-alert animate-pulse';
  return 'bg-telemetry-elevated/40 text-telemetry-text-muted';
}

function getStateLabel(state: string) {
  if (state === 'FINISHED') return 'Finalizada';
  if (state === 'IN_PROGRESS') return 'Em andamento';
  if (state === 'SCHEDULED') return 'Agendada';
  return state;
}

export function ClubMatchesTable({ matches, loading }: ClubMatchesTableProps) {
  if (loading) {
    return <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
      <p className="text-telemetry-text-muted text-sm">Carregando partidas do clube...</p>
    </div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Partidas do Clube</h2>
        <p className="text-xs text-telemetry-text-muted">Partidas anotadas por treinadores ou disputadas por atletas do clube</p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
          <p className="text-telemetry-text-muted text-sm">Nenhuma partida registrada por treinadores ou atletas deste clube ainda.</p>
        </div>
      ) : (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Data</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Confronto</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Formato</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Anotador / Criador</th>
                <th className="pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Status</th>
                <th className="pb-4 pt-4 text-right text-sm font-medium text-telemetry-text-primary">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-telemetry-border/20">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-telemetry-elevated/40 transition-colors">
                  <td className="py-4 text-xs text-telemetry-text-muted whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="py-4 text-sm text-telemetry-text-primary font-medium">
                    {m.player1?.name || 'Jogador 1'} <span className="text-telemetry-text-muted font-normal">vs</span> {m.player2?.name || 'Jogador 2'}
                  </td>
                  <td className="py-4 text-xs text-telemetry-text-muted uppercase">{m.format}</td>
                  <td className="py-4 text-xs text-telemetry-text-muted">
                    {m.createdByUser?.name || 'Anotador'}
                  </td>
                  <td className="py-4 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStateBadge(m.state)}`}>
                      {getStateLabel(m.state)}
                    </span>
                  </td>
                  <td className="py-4 text-sm text-right whitespace-nowrap">
                    <Link
                      href={m.state === 'IN_PROGRESS' ? `/match/${m.id}/scoring` : `/match/${m.id}/report`}
                      className="text-xs text-telemetry-blue hover:underline font-medium"
                    >
                      Ver Partida
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
