import { hexWithAlpha } from './advanced-stats-premium-shared';

// Linha de barra comparativa individual (Head-to-Head style)
export interface ComparativeBarRowProps {
  label: string;
  p1Value: number | string;
  p2Value: number | string;
  p1Num: number;
  p2Num: number;
  tone?: 'default' | 'error';
  p1ColorHex: string;
  p2ColorHex: string;
}

export function ComparativeBarRow({
  label,
  p1Value,
  p2Value,
  p1Num,
  p2Num,
  tone = 'default',
  p1ColorHex,
  p2ColorHex,
}: ComparativeBarRowProps) {
  const isErrorTone = tone === 'error';
  // No caso de erros, menor número é melhor. No padrão, maior número é melhor.
  const p1Wins = isErrorTone ? p1Num < p2Num && p1Num >= 0 : p1Num > p2Num;
  const p2Wins = isErrorTone ? p2Num < p1Num && p2Num >= 0 : p2Num > p1Num;

  const total = (p1Num + p2Num) || 1;
  const p1Pct = Math.min(100, Math.max(8, (p1Num / total) * 100));
  const p2Pct = Math.min(100, Math.max(8, (p2Num / total) * 100));

  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="flex justify-between items-center text-xs mb-1">
        <span
          className={`font-mono font-bold text-sm ${p1Wins ? 'scale-105' : 'text-telemetry-text-muted'}`}
          style={{ color: p1Wins ? p1ColorHex : undefined }}
        >
          {p1Value}
        </span>
        <span className="text-[11px] font-semibold text-telemetry-text-muted px-2 uppercase tracking-wide text-center">
          {label}
        </span>
        <span
          className={`font-mono font-bold text-sm ${p2Wins ? 'scale-105' : 'text-telemetry-text-muted'}`}
          style={{ color: p2Wins ? p2ColorHex : undefined }}
        >
          {p2Value}
        </span>
      </div>

      {/* Barras duplas com origem no centro */}
      <div className="grid grid-cols-2 gap-1 items-center h-2 bg-black/20 rounded-full px-0.5">
        {/* Barra P1 (cresce para a esquerda a partir do centro) */}
        <div className="flex justify-end h-full">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{
              width: `${p1Pct}%`,
              backgroundColor: isErrorTone
                ? (p1Wins ? '#10B981' : '#EF4444')
                : (p1Wins ? p1ColorHex : hexWithAlpha(p1ColorHex, 0.35)),
            }}
          />
        </div>

        {/* Barra P2 (cresce para a direita a partir do centro) */}
        <div className="flex justify-start h-full">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{
              width: `${p2Pct}%`,
              backgroundColor: isErrorTone
                ? (p2Wins ? '#10B981' : '#EF4444')
                : (p2Wins ? p2ColorHex : hexWithAlpha(p2ColorHex, 0.35)),
            }}
          />
        </div>
      </div>
    </div>
  );
}
