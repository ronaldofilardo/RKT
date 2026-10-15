'use client';

interface StatBarBilateralProps {
  label: string;
  p1Value: number;
  p2Value: number;
  p1Label: string;
  p2Label: string;
  maxReference?: number;
}

/** Barra bilateral (P1 preenche da direita, P2 da esquerda) para métricas comparáveis. */
export function StatBarBilateral({
  label,
  p1Value,
  p2Value,
  p1Label,
  p2Label,
  maxReference = 100,
}: StatBarBilateralProps) {
  const p1Width = Math.min(100, Math.max(0, (p1Value / maxReference) * 100));
  const p2Width = Math.min(100, Math.max(0, (p2Value / maxReference) * 100));

  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="font-mono font-bold text-telemetry-blue">{p1Label}</span>
        <span className="text-[11px] font-medium text-telemetry-text-muted uppercase tracking-wider">{label}</span>
        <span className="font-mono font-bold text-telemetry-error">{p2Label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 h-2">
        <div className="flex justify-end bg-telemetry-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-telemetry-blue rounded-full transition-all duration-300"
            style={{ width: `${p1Width}%` }}
          />
        </div>
        <div className="flex justify-start bg-telemetry-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-telemetry-error rounded-full transition-all duration-300"
            style={{ width: `${p2Width}%` }}
          />
        </div>
      </div>
    </div>
  );
}
