'use client';

import React, { useEffect, useState } from 'react';
import type { FinancialOverviewData } from './financeiro-types';

export function FinanceiroOverviewSubtab() {
  const [data, setData] = useState<FinancialOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/suporte/financeiro/overview')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Em Degustação / Trial', value: data?.inTrial ?? '—', color: 'text-telemetry-blue' },
    { label: 'Assinaturas Ativas', value: data?.active ?? '—', color: 'text-telemetry-volt' },
    { label: 'Em Atraso / Carência', value: data?.pastDue ?? '—', color: 'text-telemetry-alert' },
    { label: 'Suspensas / Canceladas', value: data?.suspended ?? '—', color: 'text-telemetry-error' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-4 flex flex-col gap-1">
            <span className="text-xs text-telemetry-text-muted">{c.label}</span>
            <span className={`text-2xl font-bold ${c.color}`}>{loading ? '...' : c.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">MRR Estimado (Recorrente)</span>
          <span className="text-3xl font-extrabold text-telemetry-text-primary">
            {loading ? '...' : `R$ ${(data?.estimatedMrr ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
          <p className="text-xs text-telemetry-text-muted">Projeção mensal de assinaturas ativas na plataforma.</p>
        </div>

        <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-5 flex flex-col gap-2">
          <span className="text-xs font-semibold text-telemetry-text-muted uppercase tracking-wider">Receita Total Confirmada</span>
          <span className="text-3xl font-extrabold text-telemetry-volt">
            {loading ? '...' : `R$ ${(data?.totalPaidRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </span>
          <p className="text-xs text-telemetry-text-muted">Total liquidado via Pix, boleto e cartão.</p>
        </div>
      </div>
    </div>
  );
}
