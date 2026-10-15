'use client';

import type { SetSummaryReport } from '@/core/scoring/set-summary-stats';
import { StatBarBilateral } from './set-summary-stat-bar';

type PlayerSetStats = SetSummaryReport['player1'];

interface SetSummaryStatsSectionsProps {
  p1: PlayerSetStats;
  p2: PlayerSetStats;
}

/** Seções de saque/eficiência (barras, aces, duplas faltas) e break points. */
export function SetSummaryStatsSections({ p1, p2 }: SetSummaryStatsSectionsProps) {
  return (
    <>
      <div className="bg-telemetry-elevated/40 border border-white/10 rounded-xl p-3.5 space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-telemetry-text-muted mb-2">
          Saque & Eficiência
        </h3>
        <StatBarBilateral
          label="1º Serviço em Quadra"
          p1Value={p1.firstServePct}
          p2Value={p2.firstServePct}
          p1Label={`${p1.firstServePct}% (${p1.firstServesIn}/${p1.totalServicePoints})`}
          p2Label={`${p2.firstServePct}% (${p2.firstServesIn}/${p2.totalServicePoints})`}
        />
        <StatBarBilateral
          label="Pontos com 1º Saque"
          p1Value={p1.firstServePointsWonPct}
          p2Value={p2.firstServePointsWonPct}
          p1Label={`${p1.firstServePointsWonPct}%`}
          p2Label={`${p2.firstServePointsWonPct}%`}
        />

        <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-white/5">
          <div className="bg-telemetry-elevated/70 rounded-lg p-2 text-center">
            <div className="text-[11px] text-telemetry-text-muted uppercase font-semibold mb-1">Aces</div>
            <div className="flex justify-around items-center font-mono font-bold text-sm">
              <span className="text-telemetry-blue">{p1.aces}</span>
              <span className="text-telemetry-text-muted text-xs">vs</span>
              <span className="text-telemetry-error">{p2.aces}</span>
            </div>
          </div>
          <div className="bg-telemetry-elevated/70 rounded-lg p-2 text-center">
            <div className="text-[11px] text-telemetry-text-muted uppercase font-semibold mb-1">Duplas Faltas</div>
            <div className="flex justify-around items-center font-mono font-bold text-sm">
              <span className="text-telemetry-blue">{p1.doubleFaults}</span>
              <span className="text-telemetry-text-muted text-xs">vs</span>
              <span className="text-telemetry-error">{p2.doubleFaults}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-telemetry-elevated/40 border border-white/10 rounded-xl p-3.5 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-telemetry-text-muted">
          Break Points
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-telemetry-elevated/70 rounded-lg p-2 text-center">
            <div className="text-[11px] text-telemetry-text-muted font-medium mb-1">Convertidos (Devolução)</div>
            <div className="flex justify-around items-center font-mono text-xs">
              <span className="font-bold text-telemetry-blue">
                {p1.breakPointsConverted}/{p1.breakPointsOpportunities} ({p1.breakPointsConvertedPct}%)
              </span>
              <span className="font-bold text-telemetry-error">
                {p2.breakPointsConverted}/{p2.breakPointsOpportunities} ({p2.breakPointsConvertedPct}%)
              </span>
            </div>
          </div>
          <div className="bg-telemetry-elevated/70 rounded-lg p-2 text-center">
            <div className="text-[11px] text-telemetry-text-muted font-medium mb-1">Salvos (Saque)</div>
            <div className="flex justify-around items-center font-mono text-xs">
              <span className="font-bold text-telemetry-blue">
                {p1.breakPointsSaved}/{p1.breakPointsFaced} ({p1.breakPointsSavedPct}%)
              </span>
              <span className="font-bold text-telemetry-error">
                {p2.breakPointsSaved}/{p2.breakPointsFaced} ({p2.breakPointsSavedPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
