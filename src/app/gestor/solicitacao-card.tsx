'use client';

import type { PendingRequestItem } from './types';

interface SolicitacaoCardProps {
  request: PendingRequestItem;
  submittingId: string | null;
  onDecision: (id: string, decision: 'ACCEPT' | 'REJECT') => void;
}

export function SolicitacaoCard({ request: req, submittingId, onDecision }: SolicitacaoCardProps) {
  const isBusy = submittingId === req.id;

  return (
    <div className="bg-telemetry-card border border-telemetry-border/30 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-bold text-sm text-telemetry-text-primary">{req.playerName}</h3>
          <p className="text-xs text-telemetry-text-muted">
            {req.age ? `${req.age} anos` : 'Menor dependente'} • Indicado por {req.guardianName} ({req.relation})
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
          Pendente
        </span>
      </div>

      <div className="text-[11px] text-telemetry-text-muted space-y-1">
        <p>Consentimentos autorizados pelo responsável:</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-telemetry-elevated text-telemetry-text-primary border border-telemetry-border/30">
            DATA (Ficha)
          </span>
          {req.consents.BROADCAST && (
            <span className="px-1.5 py-0.5 rounded bg-telemetry-elevated text-telemetry-blue-light border border-telemetry-border/30">
              BROADCAST (Transmissão)
            </span>
          )}
          {req.consents.STATS && (
            <span className="px-1.5 py-0.5 rounded bg-telemetry-elevated text-emerald-400 border border-telemetry-border/30">
              STATS (Estatísticas)
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-telemetry-border/20 flex gap-2 justify-end">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDecision(req.id, 'REJECT')}
          className="text-xs px-3 py-1.5 rounded-lg border border-telemetry-error/30 text-telemetry-error hover:bg-telemetry-error/10 disabled:opacity-50 font-medium"
        >
          Recusar
        </button>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDecision(req.id, 'ACCEPT')}
          className="text-xs px-4 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 font-semibold"
        >
          {isBusy ? 'Processando...' : 'Aceitar no Clube'}
        </button>
      </div>
    </div>
  );
}
