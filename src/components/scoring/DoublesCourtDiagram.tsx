'use client';

interface DoublesCourtDiagramProps {
  serverLabel: string;
  receiverDeuceLabel: string;
  receiverAdLabel: string;
  servingSide: 'player1' | 'player2';
}

/**
 * Esquema visual de quadra de duplas dividido horizontalmente em dois
 * retângulos (lado que saca vs lado que recebe).
 */
export function DoublesCourtDiagram({
  serverLabel,
  receiverDeuceLabel,
  receiverAdLabel,
  servingSide,
}: DoublesCourtDiagramProps) {
  const topIsServing = servingSide === 'player1';

  return (
    <div
      aria-label="Esquema visual da quadra de duplas"
      className="rounded-xl border border-white/15 bg-white/[0.03] p-3 flex flex-col gap-1.5 text-xs"
    >
      <div className="rounded-lg border border-white/10 bg-telemetry-blue/10 px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-telemetry-text-muted">
          {topIsServing ? 'Sacando (D1)' : 'Recebendo (D1)'}
        </span>
        <span className="font-semibold text-white truncate">
          {topIsServing ? serverLabel : `${receiverDeuceLabel} (Deuce) / ${receiverAdLabel} (Ad)`}
        </span>
      </div>

      <div className="h-px bg-white/20 my-0.5" />

      <div className="rounded-lg border border-white/10 bg-telemetry-orange/10 px-3 py-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-telemetry-text-muted">
          {!topIsServing ? 'Sacando (D2)' : 'Recebendo (D2)'}
        </span>
        <span className="font-semibold text-white truncate">
          {!topIsServing ? serverLabel : `${receiverDeuceLabel} (Deuce) / ${receiverAdLabel} (Ad)`}
        </span>
      </div>
    </div>
  );
}
