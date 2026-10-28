'use client';

import type { MeResponse } from './types';
import { StatsCard } from './stats-card';

interface DashboardHeaderProps {
  me: MeResponse;
  coachesCount: number;
  athletesCount: number;
  matchesCount: number;
}

export function DashboardHeader({
  me,
  coachesCount,
  athletesCount,
  matchesCount,
}: DashboardHeaderProps) {
  const isCtActive = me.ctStatus === 'ACTIVE';

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telemetry-text-primary">Painel do Gestor</h1>
          <p className="text-sm text-telemetry-text-muted">Clube / CT: {me.user.name} · CPF: {me.user.cpf}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isCtActive ? 'bg-telemetry-volt text-telemetry-volt opacity-20' : 'bg-telemetry-alert text-telemetry-alert opacity-20'}`}>
            {isCtActive ? 'Clube Ativo' : 'Clube Pendente'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total de Treinadores" value={coachesCount} />
        <StatsCard label="Total de Atletas Ativos" value={athletesCount} />
        <StatsCard label="Partidas do Clube" value={matchesCount} />
      </div>
    </>
  );
}

