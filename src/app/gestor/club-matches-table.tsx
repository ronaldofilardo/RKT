'use client';

import type { ClubMatchItem } from './types';
import Link from 'next/link';

interface ClubMatchesTableProps {
  matches: ClubMatchItem[];
  loading?: boolean;
}

function getStateBadge(state: string) {
  if (state === 'FINISHED') return 'bg-telemetry-volt text-telemetry-volt opacity-20';
  if (state === 'IN_PROGRESS') return 'bg-telemetry-alert text-telemetry-alert opacity-20 animate-pulse';
  return 'bg-telemetry-elevated text-telemetry-text-muted opacity-40';
}

function getStateLabel(state: string) {
  if (state === 'FINISHED') return 'Finalizada';
  if (state === 'IN_PROGRESS') return 'Em andamento';
  if (state === 'SCHEDULED') return 'Agendada';
  return state;
}

export function ClubMatchesTable({ matches, loading }: ClubMatchesTableProps) {
  if (loading) {
    return <div className="p-8 text-center text-sm text-telemetry-text-muted">Carregando partidas do clube...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-telemetry-text-primary">Partidas do Clube</h2>
          <p className="text-xs text-telemetry-text-muted">Partidas anotadas por treinadores ou disputadas por atletas do clube</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border opacity-20 text-sm font-medium text-telemetry-text-muted">
              <th className="pb-3">Data</th>
              <th className="pb-3">Confronto</th>
              <th className="pb-3">Formato</th>
              <th className="pb-3">Anotador / Criador</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-telemetry-border opacity-10">
            {matches.map((m) => (
              <tr key={m.id} className="hover:bg-telemetry-elevated opacity-30">
                <td className="py-3 text-xs text-telemetry-text-muted whitespace-nowrap">
                  {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </td>
                <td className="py-3 text-sm text-telemetry-text-primary font-medium">
                  {m.player1?.name || 'Jogador 1'} <span className="text-telemetry-text-muted font-normal">vs</span> {m.player2?.name || 'Jogador 2'}
                </td>
                <td className="py-3 text-xs text-telemetry-text-muted uppercase">{m.format}</td>
                <td className="py-3 text-xs text-telemetry-text-muted">
                  {m.createdByUser?.name || 'Anotador'}
                </td>
                <td className="py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStateBadge(m.state)}`}>
                    {getStateLabel(m.state)}
                  </span>
                </td>
                <td className="py-3 text-sm text-right whitespace-nowrap">
                  <Link
                    href={m.state === 'IN_PROGRESS' ? `/match/${m.id}/scoring` : `/match/${m.id}/report`}
                    className="text-xs text-telemetry-blue hover:underline font-medium"
                  >
                    Ver Partida
                  </Link>
                </td>
              </tr>
            ))}
            {matches.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-telemetry-text-muted text-sm">
                  Nenhuma partida registrada por treinadores ou atletas deste clube ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
