// ---------------------------------------------------------------------------
// Score bars — também usam as cores do contexto
// ---------------------------------------------------------------------------
export function ScoreBar({
  label,
  p1Value,
  p2Value,
  p1Hex,
  p2Hex,
  format = 'pct',
}: {
  label: string;
  p1Value: number;
  p2Value: number;
  p1Hex: string;
  p2Hex: string;
  format?: 'pct' | 'number';
}) {
  const total = p1Value + p2Value || 1;
  const p1Pct = (p1Value / total) * 100;
  const fmt = (v: number) => (format === 'pct' ? `${v.toFixed(0)}%` : String(Math.round(v)));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="font-mono font-bold" style={{ color: p1Hex }}>{fmt(p1Value)}</span>
        <span className="text-[9px] text-center px-1 truncate text-telemetry-text-muted">{label}</span>
        <span className="font-mono font-bold" style={{ color: p2Hex }}>{fmt(p2Value)}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
        <div className="transition-all duration-500" style={{ width: `${p1Pct}%`, background: p1Hex }} />
        <div className="transition-all duration-500" style={{ width: `${100 - p1Pct}%`, background: p2Hex }} />
      </div>
    </div>
  );
}
