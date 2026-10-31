'use client';

import type { ClubMatchItem } from './types';
import Link from 'next/link';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';
import { getMatchFormatDisplayLabel, getMatchFormatShortLabel, formatClubMatchScore } from './club-matches.logic';
import { TimelineIcon } from './timeline-icon';

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

/** Partidas em andamento ou agendadas abrem o acompanhamento em popup; finalizadas vão ao relatório. */
function opensLiveView(state: string) {
  return state === 'IN_PROGRESS' || state === 'SCHEDULED';
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
                <tr key={m.id} className="hover:bg-telemetry-elevated/40 transition-colors">
                  <td className="px-3 py-4 text-xs text-telemetry-text-muted whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="px-3 py-4 text-sm text-telemetry-text-primary font-medium">
                    {m.player1?.name || 'Jogador 1'} <span className="text-telemetry-text-muted font-normal">vs</span> {m.player2?.name || 'Jogador 2'}
                  </td>
                  <td className="px-3 py-4 text-xs font-mono font-semibold text-telemetry-text-primary whitespace-nowrap">
                    {formatClubMatchScore(m.scoreState, m.format, m.state)}
                  </td>
                  <td className="hidden md:table-cell px-3 py-4 text-xs text-telemetry-text-muted">
                    <span title={getMatchFormatDisplayLabel(m.format)}>
                      {getMatchFormatShortLabel(m.format)}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-3 py-4 text-xs text-telemetry-text-muted">
                    {m.createdByUser?.name || 'Anotador'}
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStateBadge(m.state)}`}>
                      {getStateLabel(m.state)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      {opensLiveView(m.state) && floating ? (
                        <button
                          type="button"
                          onClick={() => floating.open(m.id, `${m.player1?.name || 'Jogador 1'} × ${m.player2?.name || 'Jogador 2'}`)}
                          className="text-xs text-telemetry-blue hover:underline font-medium"
                        >
                          Ver Partida
                        </button>
                      ) : (
                        <Link
                          href={opensLiveView(m.state) ? `/matches/acompanhar/${m.id}` : `/match/${m.id}/report`}
                          className="text-xs text-telemetry-blue hover:underline font-medium"
                        >
                          Ver Partida
                        </Link>
                      )}
                      <Link
                        href={`/match/${m.id}/report`}
                        aria-label="Ver timeline"
                        title="Ver timeline da partida"
                        className="inline-flex items-center text-telemetry-text-muted hover:text-telemetry-blue transition-colors"
                      >
                        <TimelineIcon />
                      </Link>
                    </div>
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
