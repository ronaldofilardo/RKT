'use client';

import { useMemo } from 'react';
import { Section, type AdvancedStatsSectionProps } from './advanced-stats-primitives';
import { usePlayerColors } from '@/components/ui/player-color.context';
import { computeAxes, tailwindClassToHex } from './advanced-stats-radar-axes';
import { RadarSVG } from './advanced-stats-radar-svg';
import { ScoreBar } from './advanced-stats-radar-score-bar';

// ---------------------------------------------------------------------------
// Radar de Desempenho — 6 eixos, SVG puro, zero dependências externas
// Usado em Estatística Avançada (ATP/WTA style performance radar)
// ---------------------------------------------------------------------------
export function PerformanceRadarSection({ stats, player1Name, player2Name }: AdvancedStatsSectionProps) {
  const axes = useMemo(() => computeAxes(stats), [stats]);
  const { serve, returnStats } = stats;
  const colors = usePlayerColors();

  const p1Hex = tailwindClassToHex(colors.p1);
  const p2Hex = tailwindClassToHex(colors.p2);

  const hasData = serve.player1.totalPoints > 0 || serve.player2.totalPoints > 0;
  if (!hasData) return null;

  return (
    <Section title="Radar de Desempenho">
      {/* Legenda */}
      <div className="flex justify-center gap-6 mb-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: p1Hex }} aria-hidden="true" />
          <span className="font-semibold truncate max-w-[120px]" style={{ color: p1Hex }}>{player1Name}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: p2Hex }} aria-hidden="true" />
          <span className="font-semibold truncate max-w-[120px]" style={{ color: p2Hex }}>{player2Name}</span>
        </span>
      </div>

      {/* Radar SVG */}
      <div className="px-4 pb-2">
        <RadarSVG axes={axes} p1Hex={p1Hex} p2Hex={p2Hex} />
      </div>

      {/* Barras comparativas */}
      <div className="mt-4 border-t border-white/10 pt-4 space-y-1">
        {axes.map((axis) => (
          <ScoreBar
            key={axis.label}
            label={axis.label}
            p1Value={axis.p1Value}
            p2Value={axis.p2Value}
            p1Hex={p1Hex}
            p2Hex={p2Hex}
            format="pct"
          />
        ))}
        <ScoreBar
          label="Pontos Totais"
          p1Value={serve.player1.totalPoints + returnStats.player1.totalPoints}
          p2Value={serve.player2.totalPoints + returnStats.player2.totalPoints}
          p1Hex={p1Hex}
          p2Hex={p2Hex}
          format="number"
        />
      </div>
    </Section>
  );
}
