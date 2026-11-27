'use client';

import React from 'react';
import type { FinancialUserItem } from './financeiro-types';

interface FinanceiroUserRowProps {
  user: FinancialUserItem;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-telemetry-volt/20 text-telemetry-volt border border-telemetry-volt/30">ATIVO</span>;
    case 'FREE_TRIAL':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-telemetry-blue/20 text-telemetry-blue-light border border-telemetry-blue/30">DEGUSTAÇÃO</span>;
    case 'LAST_FREE':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-telemetry-alert/20 text-telemetry-alert-light border border-telemetry-alert/30">ÚLTIMA LIVRE</span>;
    case 'EXPIRED':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-telemetry-error/20 text-telemetry-error border border-telemetry-error/30">ACESSO RESTRITO</span>;
    case 'PAST_DUE':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-telemetry-orange/20 text-telemetry-orange-light border border-telemetry-orange/30">EM ATRASO</span>;
    case 'EXEMPT':
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">ISENTO / CT</span>;
    default:
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-telemetry-elevated text-telemetry-text-muted border border-telemetry-border/20">{status}</span>;
  }
}

export function FinanceiroUserRow({ user }: FinanceiroUserRowProps) {
  const quotaText = user.matchesLimit != null
    ? `${user.matchesUsed}/${user.matchesLimit} partidas`
    : user.daysRemaining != null
    ? `${user.daysRemaining} dias restantes`
    : 'Ilimitado';

  const feeText = user.monthlyFee > 0
    ? `R$ ${user.monthlyFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`
    : 'Gratuito';

  const dueDateText = user.dueDate ? new Date(user.dueDate).toLocaleDateString('pt-BR') : '—';

  return (
    <tr className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/40 transition-colors">
      <td className="p-3">
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-telemetry-text-primary">{user.name}</span>
          <span className="text-xs text-telemetry-text-muted">{user.email}</span>
          {user.clubName && <span className="text-[10px] text-telemetry-blue-light">{user.clubName}</span>}
        </div>
      </td>
      <td className="p-3">
        <span className="px-2 py-0.5 text-[10px] font-medium bg-telemetry-elevated text-telemetry-text-muted rounded">
          {user.role}
        </span>
      </td>
      <td className="p-3">
        <div className="flex flex-col gap-1 items-start">
          {getStatusBadge(user.status)}
          <span className="text-[11px] text-telemetry-text-muted">{quotaText}</span>
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-telemetry-text-primary">{user.planName}</span>
          {user.cycle && (
            <span className="text-[10px] text-telemetry-text-muted">
              Ciclo: {user.cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}
            </span>
          )}
        </div>
      </td>
      <td className="p-3">
        <span className="text-xs text-telemetry-text-primary font-mono">{user.billingType ?? '—'}</span>
      </td>
      <td className="p-3">
        <span className="text-xs font-semibold text-telemetry-text-primary">{feeText}</span>
      </td>
      <td className="p-3">
        <span className="text-xs text-telemetry-text-muted">{dueDateText}</span>
      </td>
    </tr>
  );
}
