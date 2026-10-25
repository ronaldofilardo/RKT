'use client';

import {
  PlayerColumnHeader,
  Section,
  type AdvancedStatsSectionProps,
} from './advanced-stats-primitives';

export function StrokeMatrixSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const p1Matrix = stats.strokeMatrix?.player1;
  const p2Matrix = stats.strokeMatrix?.player2;
  if (!p1Matrix || !p2Matrix) return null;

  return (
    <Section title="8. Estatísticas dos Golpes">
      <PlayerColumnHeader player1Name={player1Name} player2Name={player2Name} />
      <div className="text-[11px] text-telemetry-text-muted text-center mb-3">
        Formato: <span className="text-telemetry-blue font-bold">W</span> (Winners) /{' '}
        <span className="text-telemetry-alert font-bold">EF</span> (Erros Forçados) /{' '}
        <span className="text-telemetry-error font-bold">ENF</span> (Não Forçados) &bull;{' '}
        <span className="text-white font-bold">Tot</span>
      </div>
      <div className="space-y-1">
        {p1Matrix.map((p1Row, idx) => {
          const p2Row = p2Matrix[idx] ?? { winners: 0, forcedErrors: 0, unforcedErrors: 0, total: 0 };
          const hasActivity = p1Row.total > 0 || p2Row.total > 0;
          if (!hasActivity) return null;

          return (
            <div
              key={p1Row.code}
              className="grid grid-cols-[1fr_140px_1fr] gap-2 items-center py-1.5 border-b border-white/5 last:border-0 text-xs"
            >
              <div className="text-right font-mono">
                <span className="text-telemetry-blue font-semibold">{p1Row.winners}</span>
                <span className="text-white/30 mx-0.5">/</span>
                <span className="text-telemetry-alert font-semibold">{p1Row.forcedErrors}</span>
                <span className="text-white/30 mx-0.5">/</span>
                <span className="text-telemetry-error font-semibold">{p1Row.unforcedErrors}</span>
                <span className="text-white/60 ml-1.5 font-bold">({p1Row.total})</span>
              </div>
              <div className="text-center font-medium text-telemetry-text-muted w-[140px] truncate">
                {p1Row.name}
              </div>
              <div className="text-left font-mono">
                <span className="text-telemetry-blue font-semibold">{p2Row.winners}</span>
                <span className="text-white/30 mx-0.5">/</span>
                <span className="text-telemetry-alert font-semibold">{p2Row.forcedErrors}</span>
                <span className="text-white/30 mx-0.5">/</span>
                <span className="text-telemetry-error font-semibold">{p2Row.unforcedErrors}</span>
                <span className="text-white/60 ml-1.5 font-bold">({p2Row.total})</span>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
