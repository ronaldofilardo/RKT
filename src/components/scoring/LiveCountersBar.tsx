'use client';

import React, { useState } from 'react';
import type { LiveMatchCounters } from '@/core/scoring/live-tactical-insights';

interface LiveCountersBarProps {
  counters: LiveMatchCounters;
  player1Name: string;
  player2Name: string;
  completedSetsCount?: number;
  onOpenSetSummary?: () => void;
}

export function LiveCountersBar({
  counters,
  player1Name,
  player2Name,
  completedSetsCount = 0,
  onOpenSetSummary,
}: LiveCountersBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const p1Short = player1Name.split(' ')[0] || 'J1';
  const p2Short = player2Name.split(' ')[0] || 'J2';

  const hasAnyStat =
    counters.totalPointsWon.p1 > 0 ||
    counters.totalPointsWon.p2 > 0 ||
    counters.aces.p1 > 0 ||
    counters.aces.p2 > 0;

  if (!hasAnyStat) {
    return null;
  }

  return (
    <div
      data-testid="live-counters-bar"
      className="bg-telemetry-card border border-white/10 rounded-xl px-2.5 py-1.5 shadow-sm text-xs select-none transition-all my-1 relative z-10"
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
            <span className="text-telemetry-volt">⚡</span>
            <span>Estatísticas ao Vivo</span>
          </div>
          {completedSetsCount > 0 && onOpenSetSummary && (
            <button
              type="button"
              onClick={onOpenSetSummary}
              className="text-[10px] bg-telemetry-volt/15 border border-telemetry-volt/30 text-telemetry-volt font-bold px-1.5 py-0.5 rounded hover:bg-telemetry-volt/25 transition-all flex items-center gap-1"
              title="Ver análise gráfica detalhada dos sets finalizados"
            >
              📊 Resumo do Set
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
          aria-label={collapsed ? 'Expandir estatísticas' : 'Recolher estatísticas'}
        >
          {collapsed ? '▼ Ver' : '▲ Ocultar'}
        </button>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center pt-1 border-t border-white/5">
          {/* Aces */}
          <div className="bg-black/30 rounded p-1 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">Aces</span>
            <div className="flex justify-around items-center font-space-grotesk font-bold text-xs mt-0.5">
              <span className="text-white" title={`${p1Short}: ${counters.aces.p1}`}>{counters.aces.p1}</span>
              <span className="text-slate-500 text-[10px]">:</span>
              <span className="text-white" title={`${p2Short}: ${counters.aces.p2}`}>{counters.aces.p2}</span>
            </div>
          </div>

          {/* Duplas Faltas */}
          <div className="bg-black/30 rounded p-1 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">Duplas Faltas</span>
            <div className="flex justify-around items-center font-space-grotesk font-bold text-xs mt-0.5">
              <span className="text-amber-400" title={`${p1Short}: ${counters.doubleFaults.p1}`}>{counters.doubleFaults.p1}</span>
              <span className="text-slate-500 text-[10px]">:</span>
              <span className="text-amber-400" title={`${p2Short}: ${counters.doubleFaults.p2}`}>{counters.doubleFaults.p2}</span>
            </div>
          </div>

          {/* Break Points */}
          <div className="bg-black/30 rounded p-1 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">Break Points</span>
            <div className="flex justify-around items-center font-space-grotesk font-bold text-xs mt-0.5">
              <span className="text-emerald-400" title={`${p1Short}: ${counters.breakPoints.p1.converted}/${counters.breakPoints.p1.total}`}>
                {counters.breakPoints.p1.converted}/{counters.breakPoints.p1.total}
              </span>
              <span className="text-slate-500 text-[10px]">:</span>
              <span className="text-emerald-400" title={`${p2Short}: ${counters.breakPoints.p2.converted}/${counters.breakPoints.p2.total}`}>
                {counters.breakPoints.p2.converted}/{counters.breakPoints.p2.total}
              </span>
            </div>
          </div>

          {/* Erros (EF / ENF) */}
          <div className="bg-black/30 rounded p-1 border border-white/5">
            <span className="text-[10px] text-slate-400 block font-medium">EF / ENF</span>
            <div className="flex justify-around items-center font-space-grotesk font-bold text-xs mt-0.5">
              <span className="text-slate-300" title={`${p1Short}: ${counters.forcedErrors.p1} EF / ${counters.unforcedErrors.p1} ENF`}>
                {counters.forcedErrors.p1}/{counters.unforcedErrors.p1}
              </span>
              <span className="text-slate-500 text-[10px]">:</span>
              <span className="text-slate-300" title={`${p2Short}: ${counters.forcedErrors.p2} EF / ${counters.unforcedErrors.p2} ENF`}>
                {counters.forcedErrors.p2}/{counters.unforcedErrors.p2}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
