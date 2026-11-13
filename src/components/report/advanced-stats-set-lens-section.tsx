'use client';

import { Section } from './advanced-stats-primitives';
import { usePlayerColors } from '@/components/ui/player-color.context';
import { tailwindClassToHex, type PremiumVisualProps } from './advanced-stats-premium-shared';
import { useSetLensModel } from './advanced-stats-set-lens-model';
import { SetLensTabs } from './advanced-stats-set-lens-tabs';
import { SetLensWinnerHighlight } from './advanced-stats-set-lens-winner-highlight';
import { MiniRadarSvg } from './advanced-stats-mini-radar-svg';
import { ComparativeBarRow } from './advanced-stats-comparative-bar-row';

// Set Lens — análise detalhada por set (tabs + destaque do vencedor + radar + barras)
export function SetLensSection({ stats, player1Name, player2Name, report }: PremiumVisualProps) {
  const colors = usePlayerColors();
  const p1Hex = tailwindClassToHex(colors.p1, '#CCFF00');
  const p2Hex = tailwindClassToHex(colors.p2, '#F8FAFC');

  const { sets, selectedSet, setSelectedSet, currentSetBreakdown, radarAxes, setWinnerInfo, compBars } =
    useSetLensModel({ stats, player1Name, player2Name, report }, p1Hex, p2Hex);

  return (
    <Section title="Set Lens — Análise Detalhada por Set">
      {/* TABS POR SET */}
      <SetLensTabs sets={sets} selectedSet={selectedSet} onSelect={setSelectedSet} />

      {/* DESTAQUE ANIMADO PARA QUEM VENCEU */}
      <SetLensWinnerHighlight
        selectedSet={selectedSet}
        winnerName={setWinnerInfo.winnerName ?? ''}
        scoreText={setWinnerInfo.scoreText}
        p1Games={currentSetBreakdown.p1Games}
        p2Games={currentSetBreakdown.p2Games}
        duration={currentSetBreakdown.duration}
      />

      {/* GRID: MINI-RADAR + BARRAS COMPARATIVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-center">
        {/* MINI-RADAR */}
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-black/25 border border-white/5">
          <div className="text-[11px] font-bold text-telemetry-text-muted uppercase tracking-wider mb-2 text-center">
            Radar de Desempenho (Set {selectedSet})
          </div>
          <MiniRadarSvg
            axes={radarAxes}
            p1ColorHex={p1Hex}
            p2ColorHex={p2Hex}
            player1Name={player1Name}
            player2Name={player2Name}
          />
        </div>

        {/* BARRAS COMPARATIVAS */}
        <div className="rounded-xl bg-black/20 border border-white/5 p-4 space-y-1">
          <div className="text-[11px] font-bold text-telemetry-text-muted uppercase tracking-wider mb-2 flex justify-between">
            <span style={{ color: p1Hex }}>{player1Name}</span>
            <span>Estatísticas Comparativas (Set {selectedSet})</span>
            <span style={{ color: p2Hex }}>{player2Name}</span>
          </div>

          {compBars.map((bar) => (
            <ComparativeBarRow
              key={bar.label}
              label={bar.label}
              p1Value={bar.p1Val}
              p2Value={bar.p2Val}
              p1Num={bar.p1Num}
              p2Num={bar.p2Num}
              tone={bar.tone}
              p1ColorHex={p1Hex}
              p2ColorHex={p2Hex}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
