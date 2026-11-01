'use client';

import type { MeResponse } from './types';

interface DashboardHeaderProps {
  me: MeResponse;
  coachesCount?: number;
  athletesCount?: number;
  matchesCount?: number;
}

export function DashboardHeader({ me }: DashboardHeaderProps) {
  const isCtActive = me.ctStatus === 'ACTIVE';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div>
        <h1 className="sr-only">Painel do Gestor</h1>
        <p className="text-sm text-telemetry-text-muted">
          Clube / CT: <span className="text-telemetry-text-primary font-medium">{me.user.name}</span> · CPF: {me.user.cpf}
        </p>
      </div>
      <div className="flex gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isCtActive ? 'bg-telemetry-volt/20 text-telemetry-volt' : 'bg-telemetry-alert/20 text-telemetry-alert'}`}>
          {isCtActive ? 'Clube Ativo' : 'Clube Pendente'}
        </span>
      </div>
    </div>
  );
}
