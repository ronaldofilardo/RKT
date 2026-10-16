'use client';

import React, { useState } from 'react';
import type { LiveMatchCounters } from '@/core/scoring/live-tactical-insights';
import { LiveCountersGrid } from './live-counters-grid';

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
      className="bg-telemetry-card border border-white/10 rounded-xl px-2 py-1 shadow-sm text-xs select-none transition-all relative z-10"
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-telemetry-text-primary">
            <span className="text-telemetry-volt">⚡</span>
            <span>Estatísticas ao Vivo</span>
          </div>
          {completedSetsCount > 0 && onOpenSetSummary && (
            <button
              type="button"
              onClick={onOpenSetSummary}
              className="text-[10px] bg-telemetry-volt/15 border border-telemetry-volt/30 text-telemetry-volt font-bold px-1.5 py-0 rounded hover:bg-telemetry-volt/25 transition-all flex items-center gap-1"
              title="Ver análise gráfica detalhada dos sets finalizados"
            >
              📊 Resumo do Set
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] text-telemetry-text-muted hover:text-telemetry-text-primary px-1.5 py-0 rounded hover:bg-white/5 transition-colors"
          aria-label={collapsed ? 'Expandir estatísticas' : 'Recolher estatísticas'}
        >
          {collapsed ? '▼ Ver' : '▲ Ocultar'}
        </button>
      </div>

      {!collapsed && (
        <LiveCountersGrid counters={counters} p1Short={p1Short} p2Short={p2Short} />
      )}
    </div>
  );
}
