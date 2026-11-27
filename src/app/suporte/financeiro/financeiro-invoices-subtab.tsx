'use client';

import React, { useState, useEffect } from 'react';
import type { FinancialInvoiceItem } from './financeiro-types';

export function FinanceiroInvoicesSubtab() {
  const [invoices, setInvoices] = useState<FinancialInvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/suporte/financeiro/invoices')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => setInvoices(d?.items || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/20 bg-telemetry-elevated/60 text-[11px] uppercase tracking-wider text-telemetry-text-muted">
              <th className="p-3">Pagador</th>
              <th className="p-3">Plano</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Vencimento</th>
              <th className="p-3">Forma</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ações / Links</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-telemetry-text-muted">Carregando faturas...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-telemetry-text-muted">Nenhuma cobrança registrada ainda.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/40">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-telemetry-text-primary">{inv.payerName}</span>
                      {inv.payerEmail && <span className="text-xs text-telemetry-text-muted">{inv.payerEmail}</span>}
                    </div>
                  </td>
                  <td className="p-3"><span className="text-xs font-medium text-telemetry-text-primary">{inv.planTier}</span></td>
                  <td className="p-3"><span className="text-xs font-bold text-telemetry-volt">R$ {inv.value.toFixed(2)}</span></td>
                  <td className="p-3"><span className="text-xs text-telemetry-text-muted">{inv.dueDate}</span></td>
                  <td className="p-3"><span className="text-xs text-telemetry-text-primary font-mono">{inv.billingType}</span></td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      inv.status === 'CONFIRMED' || inv.status === 'RECEIVED'
                        ? 'bg-telemetry-volt/20 text-telemetry-volt'
                        : inv.status === 'OVERDUE'
                        ? 'bg-telemetry-error/20 text-telemetry-error'
                        : 'bg-telemetry-alert/20 text-telemetry-alert-light'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {inv.invoiceUrl && (
                        <a href={inv.invoiceUrl} target="_blank" rel="noreferrer" className="text-xs text-telemetry-blue-light hover:underline font-medium">
                          Fatura
                        </a>
                      )}
                      {inv.bankSlipUrl && (
                        <a href={inv.bankSlipUrl} target="_blank" rel="noreferrer" className="text-xs text-telemetry-text-muted hover:underline font-medium">
                          Boleto
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
