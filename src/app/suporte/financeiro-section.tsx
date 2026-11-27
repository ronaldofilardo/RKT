'use client';

import React, { useState, useEffect } from 'react';
import type { FinanceiroSubtab } from './financeiro/financeiro-types';
import { FinanceiroSubtabNav } from './financeiro/financeiro-subtab-nav';
import { FinanceiroOverviewSubtab } from './financeiro/financeiro-overview-subtab';
import { FinanceiroUsersSubtab } from './financeiro/financeiro-users-subtab';
import { FinanceiroInvoicesSubtab } from './financeiro/financeiro-invoices-subtab';
import { FinanceiroPlansSubtab } from './financeiro/financeiro-plans-subtab';

export function FinanceiroSection() {
  const [subtab, setSubtab] = useState<FinanceiroSubtab>('visao-geral');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('subtab') as FinanceiroSubtab;
      if (q && ['visao-geral', 'usuarios', 'cobrancas', 'planos'].includes(q)) {
        setSubtab(q);
      }
    }
  }, []);

  return (
    <div className="p-0 sm:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Financeiro</h2>
        <p className="text-xs text-telemetry-text-muted">
          Gestão de assinaturas, cobranças e planos da plataforma.
        </p>
      </div>

      <FinanceiroSubtabNav currentTab={subtab} onTabChange={setSubtab} />

      <div>
        {subtab === 'visao-geral' && <FinanceiroOverviewSubtab />}
        {subtab === 'usuarios' && <FinanceiroUsersSubtab />}
        {subtab === 'cobrancas' && <FinanceiroInvoicesSubtab />}
        {subtab === 'planos' && <FinanceiroPlansSubtab />}
      </div>
    </div>
  );
}
