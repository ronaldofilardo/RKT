'use client';

import React from 'react';
import type { BillingAccountState } from '@/types/billing';

interface TrialCounterBarProps {
  billing: BillingAccountState | null;
  onOpenPlans: () => void;
}

export function TrialCounterBar({ billing, onOpenPlans }: TrialCounterBarProps) {
  if (!billing || billing.status === 'ACTIVE' || billing.status === 'EXEMPT') {
    return null;
  }

  const isExpired = billing.status === 'EXPIRED';
  const isLastFree = billing.status === 'LAST_FREE';

  const containerClasses = isExpired
    ? 'bg-telemetry-red/10 border-telemetry-red/30 text-telemetry-red'
    : isLastFree
    ? 'bg-telemetry-amber/10 border-telemetry-amber/30 text-telemetry-amber'
    : 'bg-telemetry-surface border-telemetry-border text-telemetry-text-primary';

  const badgeText = isExpired
    ? 'Modo Consulta'
    : isLastFree
    ? 'Último Acesso Livre'
    : billing.daysRemaining !== null
    ? `${billing.daysRemaining} dias de teste`
    : `${billing.matchesUsed}/${billing.matchesLimit ?? 3} partidas`;

  return (
    <aside aria-label="Status da franquia" className={`border-b px-4 py-2.5 transition-colors ${containerClasses}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-black/20">
            {badgeText}
          </span>
          <p className="text-xs sm:text-sm text-telemetry-text-secondary truncate">
            {isExpired && 'Degustação encerrada. Histórico liberado em modo consulta. Assine para registrar novos jogos.'}
            {isLastFree && 'Você está na última partida livre. Ao concluir, novas criações serão restritas a assinantes.'}
            {!isExpired && !isLastFree && (
              billing.daysRemaining !== null
                ? `Degustação CT: restam ${billing.daysRemaining} de 30 dias. Depois, novas anotações exigirão plano.`
                : `Franquia gratuita: ${billing.matchesUsed} de ${billing.matchesLimit ?? 3} usadas. Ao final, a conta migra para modo consulta.`
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPlans}
          className="shrink-0 self-start sm:self-auto px-3 py-1 rounded text-xs font-medium bg-telemetry-blue hover:bg-telemetry-blue/80 text-white transition-colors"
        >
          {isExpired ? 'Assinar Agora' : 'Ver Planos'}
        </button>
      </div>
    </aside>
  );
}
