'use client';

import { useMemo, useState } from 'react';
import type { ExternalAthlete, ExternalClub, MembershipItem, UserItem } from './types';
import { AvulsoUsersTable } from './avulso-users-table';
import { ExternosAthletesTable } from './externos-athletes-table';
import { ExternosClubsTable } from './externos-clubs-table';
import { splitAvulsos, type AvulsosFilter } from './avulsos-logic';

interface AvulsosSectionProps {
  athletes: ExternalAthlete[];
  clubs: ExternalClub[];
  totalAthletes: number;
  totalClubs: number;
  users: UserItem[];
  memberships: MembershipItem[];
}

const FILTERS: Array<{ key: AvulsosFilter; label: string; description: string }> = [
  { key: 'ATLETAS', label: 'Atletas Avulsos', description: 'Atletas sem registro em PlayerCT.' },
  { key: 'TREINADORES', label: 'Treinadores Avulsos', description: 'Treinadores sem ctId ativo.' },
  { key: 'ESPECTADORES', label: 'Espectadores Avulsos', description: 'Usuários sem vínculos a CTs.' },
];

export function AvulsosSection({
  athletes, clubs, totalAthletes, totalClubs, users, memberships,
}: AvulsosSectionProps) {
  const [filter, setFilter] = useState<AvulsosFilter>('ATLETAS');
  const groups = useMemo(
    () => splitAvulsos(athletes, users, memberships),
    [athletes, users, memberships],
  );
  const counts: Record<AvulsosFilter, number> = {
    ATLETAS: totalAthletes + groups.atletasComConta.length,
    TREINADORES: groups.treinadores.length,
    ESPECTADORES: groups.espectadores.length,
  };

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Contas Avulsas</h2>
        <p className="text-xs text-telemetry-text-muted">Selecione uma categoria para listar as contas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-label="Filtrar contas avulsas">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={`text-left rounded-xl shadow border p-4 bg-telemetry-card transition-colors ${
                active ? 'border-telemetry-blue' : 'border-telemetry-border/20 hover:bg-telemetry-elevated/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-telemetry-text-primary">{f.label}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    active ? 'bg-telemetry-blue/20 text-telemetry-blue' : 'bg-telemetry-volt/20 text-telemetry-volt'
                  }`}
                >
                  {counts[f.key]}
                </span>
              </div>
              <p className="text-xs text-telemetry-text-muted mt-2">{f.description}</p>
            </button>
          );
        })}
      </div>

      {filter === 'ATLETAS' && (
        <>
          <ExternosAthletesTable athletes={athletes} total={totalAthletes} />
          {groups.atletasComConta.length > 0 && (
            <AvulsoUsersTable
              users={groups.atletasComConta}
              title="Atletas com conta, sem clube"
              emptyMessage="Nenhum atleta sem clube encontrado."
            />
          )}
          <ExternosClubsTable clubs={clubs} athletes={athletes} total={totalClubs} />
        </>
      )}
      {filter === 'TREINADORES' && (
        <AvulsoUsersTable users={groups.treinadores} emptyMessage="Nenhum treinador avulso encontrado." />
      )}
      {filter === 'ESPECTADORES' && (
        <AvulsoUsersTable users={groups.espectadores} emptyMessage="Nenhum espectador avulso encontrado." />
      )}
    </div>
  );
}
