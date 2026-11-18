'use client';

import { useState } from 'react';
import type { PendingRequestItem } from './types';
import { SolicitacaoCard } from './solicitacao-card';

interface SolicitacoesTableProps {
  requests: PendingRequestItem[];
  onRefresh: () => void;
}

export function SolicitacoesTable({ requests, onRefresh }: SolicitacoesTableProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const handleDecision = async (id: string, decision: 'ACCEPT' | 'REJECT') => {
    try {
      setSubmittingId(id);
      const res = await fetch(`/api/gestor/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) onRefresh();
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-telemetry-text-primary flex items-center gap-2">
          <span>📩</span> Solicitações de Ingresso de Menores ({requests.length})
        </h2>
        <span className="text-xs text-telemetry-text-muted">Indicações enviadas por responsáveis legais</span>
      </div>

      {requests.length === 0 ? (
        <div className="bg-telemetry-card rounded-xl border border-telemetry-border/20 p-8 text-center text-telemetry-text-muted text-sm">
          Nenhuma solicitação pendente no momento.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {requests.map((req) => (
            <SolicitacaoCard
              key={req.id}
              request={req}
              submittingId={submittingId}
              onDecision={handleDecision}
            />
          ))}
        </div>
      )}
    </div>
  );
}
