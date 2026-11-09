'use client';

import { Fragment, useState } from 'react';
import type { ClubMatchItem } from './types';
import { ClubMatchRow } from './club-match-row';
import { filterByAnnotator, groupClubMatches, listAnnotators } from './group-club-matches.logic';
import { useFloatingSpectatorOptional } from '@/contexts/FloatingSpectatorContext';

interface ClubMatchesTableProps {
  matches: ClubMatchItem[];
  loading?: boolean;
}

const HEAD_CELLS = ['Data', 'Confronto', 'Placar', 'Formato', 'Anotador / Criador', 'Status', 'Ação'];

export function ClubMatchesTable({ matches, loading }: ClubMatchesTableProps) {
  const floating = useFloatingSpectatorOptional();
  const [annotator, setAnnotator] = useState('');

  const annotators = listAnnotators(matches);
  const groups = groupClubMatches(filterByAnnotator(matches, annotator || null));

  if (loading) {
    return <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
      <p className="text-telemetry-text-muted text-sm">Carregando partidas do clube...</p>
    </div>;
  }

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-telemetry-text-primary">Partidas do Clube</h2>
          <p className="text-xs text-telemetry-text-muted">Agrupadas pelo cartaz público; privadas ao final</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-telemetry-text-muted">
          Membro anotador
          <select
            value={annotator}
            onChange={(event) => setAnnotator(event.target.value)}
            className="px-2 py-1 rounded-lg border border-white/10 bg-telemetry-elevated text-telemetry-text-primary [color-scheme:dark]"
          >
            <option value="">Todos</option>
            {annotators.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </label>
      </div>

      {groups.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-8 text-center">
          <p className="text-telemetry-text-muted text-sm">Nenhuma partida registrada por treinadores ou atletas deste clube ainda.</p>
        </div>
      ) : (
        <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left border-collapse">
            <thead>
              <tr className="border-b border-telemetry-border/40">
                {HEAD_CELLS.map((cell) => (
                  <th key={cell} className="px-3 py-4 text-sm font-medium text-telemetry-text-primary">{cell}</th>
                ))}
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody key={group.key} className="divide-y divide-telemetry-border/20">
                <tr className="bg-telemetry-elevated/40">
                  <th colSpan={HEAD_CELLS.length} scope="colgroup" className="px-3 py-2 text-left text-xs font-semibold text-telemetry-text-primary">
                    {group.source
                      ? `📡 ${group.source.player1.name} × ${group.source.player2.name} · ${group.matches.length} anotação(ões)`
                      : 'Partidas privadas / avulsas'}
                  </th>
                </tr>
                {group.matches.map((m) => (
                  <Fragment key={m.id}>
                    <ClubMatchRow match={m} floating={floating} />
                  </Fragment>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}
