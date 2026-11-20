'use client';

import { useState } from 'react';
import { StatsCard } from '@/app/gestor/stats-card';
import { EmitirSenhaModal } from './emitir-senha-modal';

interface SuporteHeaderProps {
  clubsCount: number;
  gestoresCount: number;
  avulsosCount: number;
  externosCount: number;
}

export function SuporteHeader({ clubsCount, gestoresCount, avulsosCount, externosCount }: SuporteHeaderProps) {
  const [senhaModalOpen, setSenhaModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-telemetry-text-primary">Painel do Suporte</h1>
          <p className="text-sm text-telemetry-text-muted">Gestão de clubes, gestores e contas da plataforma</p>
        </div>
        {/* F4 — acesso global à emissão de senha provisória, independente da aba ativa */}
        <button
          onClick={() => setSenhaModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 bg-telemetry-elevated border border-telemetry-border/30 text-sm font-medium text-telemetry-text-primary rounded-lg hover:bg-telemetry-elevated/80 transition-colors whitespace-nowrap"
        >
          Emitir senha provisória
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard label="Total de Clubes/CTs" value={clubsCount} />
        <StatsCard label="Total de Gestores" value={gestoresCount} />
        <StatsCard label="Contas Avulsas" value={avulsosCount} />
        <StatsCard label="Atletas Externos" value={externosCount} />
      </div>

      <EmitirSenhaModal open={senhaModalOpen} onOpenChange={setSenhaModalOpen} />
    </>
  );
}
