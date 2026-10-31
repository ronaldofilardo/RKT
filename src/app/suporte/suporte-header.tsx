'use client';

import { StatsCard } from '@/app/gestor/stats-card';

interface SuporteHeaderProps {
  clubsCount: number;
  gestoresCount: number;
  avulsosCount: number;
}

export function SuporteHeader({ clubsCount, gestoresCount, avulsosCount }: SuporteHeaderProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telemetry-text-primary">Painel do Suporte</h1>
          <p className="text-sm text-telemetry-text-muted">Gestão de clubes, gestores e contas da plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard label="Total de Clubes/CTs" value={clubsCount} />
        <StatsCard label="Total de Gestores" value={gestoresCount} />
        <StatsCard label="Contas Avulsas" value={avulsosCount} />
      </div>
    </>
  );
}
