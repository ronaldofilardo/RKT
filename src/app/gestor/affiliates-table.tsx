'use client';

import { useState, useMemo } from 'react';
import type { AffiliateAthleteItem } from './affiliates.types';
import { AffiliatesRow } from './affiliates-row';

interface AffiliatesTableProps {
  athletes: AffiliateAthleteItem[];
  loading?: boolean;
}

export function AffiliatesTable({ athletes, loading }: AffiliatesTableProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return athletes;
    return athletes.filter((a) => {
      const matchName = a.name.toLowerCase().includes(q);
      const matchNick = a.nickname?.toLowerCase().includes(q);
      const matchClub = a.clubName?.toLowerCase().includes(q);
      const matchCoach = a.coachName?.toLowerCase().includes(q);
      return matchName || matchNick || matchClub || matchCoach;
    });
  }, [athletes, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar por nome, @nickname, clube ou treinador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-telemetry-surface border border-telemetry-border/30 rounded-lg px-3 py-2 text-sm text-telemetry-text-primary placeholder:text-telemetry-text-muted focus:outline-none focus:border-telemetry-blue"
          />
        </div>
        <div className="text-xs text-telemetry-text-muted">
          Exibindo {filtered.length} de {athletes.length} atleta{athletes.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="bg-telemetry-surface/40 border border-telemetry-border/20 rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-telemetry-border/20 bg-telemetry-surface/60 text-xs text-telemetry-text-muted uppercase">
              <th className="py-2.5 px-4 font-semibold">Atleta</th>
              <th className="py-2.5 px-4 font-semibold">Afiliação (Clube / Treinador)</th>
              <th className="py-2.5 px-4 font-semibold">Dados Técnicos</th>
              <th className="py-2.5 px-4 font-semibold">Localidade / Ranking</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-telemetry-text-muted">
                  Carregando atletas...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-telemetry-text-muted">
                  Nenhum atleta encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((athlete) => <AffiliatesRow key={athlete.id} athlete={athlete} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
