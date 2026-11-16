'use client';

import React from 'react';
import type { GuardianDependentMatchItem } from '@/app/api/guardians/me/matches/matches-read.logic';

interface DependentMatchesListProps {
  matches: GuardianDependentMatchItem[];
  loading: boolean;
}

function stateBadge(state: string) {
  switch (state) {
    case 'IN_PROGRESS':
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-telemetry-volt/20 text-telemetry-volt border border-telemetry-volt/40 animate-pulse">Em Andamento</span>;
    case 'FINISHED':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Concluída</span>;
    case 'CANCELLED':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">Cancelada</span>;
    case 'SCHEDULED':
    default:
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Agendada</span>;
  }
}

export function DependentMatchesList({ matches, loading }: DependentMatchesListProps) {
  return (
    <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-telemetry-border/20 pb-3">
        <div>
          <h2 className="text-base font-bold text-telemetry-text-primary flex items-center gap-2">
            <span>🎾</span> Partidas do Menor (Acompanhamento)
          </h2>
          <p className="text-xs text-telemetry-text-muted">
            Acompanhe quais partidas estão sendo criadas e anotadas pelo clube ou treinadores.
          </p>
        </div>
        <span className="text-[11px] font-medium text-telemetry-blue bg-telemetry-blue/10 border border-telemetry-blue/30 px-2.5 py-1 rounded-lg self-start sm:self-auto">
          Conta de Acompanhante
        </span>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-telemetry-text-muted">Carregando partidas...</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 text-telemetry-text-muted space-y-2">
          <p className="text-sm font-medium">Nenhuma partida criada ou anotada para o menor até o momento.</p>
          <p className="text-xs">Assim que o clube ou treinador agendar ou iniciar um jogo com o atleta, ele aparecerá aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={m.id} className="p-3.5 bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-telemetry-text-primary">
                  {m.dependentName} <span className="text-telemetry-text-muted font-normal text-xs">vs</span> {m.opponentName}
                </span>
                {stateBadge(m.state)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-telemetry-text-muted">
                <div><span className="text-telemetry-text-primary font-medium">👤 Criado por:</span> {m.createdByName}</div>
                <div><span className="text-telemetry-text-primary font-medium">✍️ Anotador:</span> {m.annotatorName}</div>
                <div><span className="text-telemetry-text-primary font-medium">📅 Data:</span> {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString('pt-BR') : new Date(m.createdAt).toLocaleDateString('pt-BR')}</div>
              </div>
              {m.trainingCenterName && (
                <div className="text-[11px] text-telemetry-text-muted border-t border-white/5 pt-1.5 flex items-center gap-1">
                  <span>🏟️</span> Clube / CT: <strong className="text-telemetry-text-primary">{m.trainingCenterName}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
