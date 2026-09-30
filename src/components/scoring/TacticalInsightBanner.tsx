'use client';

import React, { useState } from 'react';
import type { TacticalInsight } from '@/core/scoring/live-tactical-insights';

interface TacticalInsightBannerProps {
  insights: TacticalInsight[];
}

export function TacticalInsightBanner({ insights }: TacticalInsightBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!insights || insights.length === 0) {
    return null;
  }

  // Mostra o insight de maior prioridade no momento
  const current = insights[0];

  const getBorderAndBg = (type: TacticalInsight['type']) => {
    switch (type) {
      case 'weakness':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-200';
      case 'opportunity':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200';
      case 'trend':
        return 'bg-blue-500/15 border-blue-500/40 text-blue-200';
      case 'alert':
      default:
        return 'bg-purple-500/15 border-purple-500/40 text-purple-200';
    }
  };

  return (
    <div
      data-testid="tactical-insight-banner"
      className={`border rounded-xl px-2.5 py-1.5 my-0.5 shadow-sm text-xs relative z-10 transition-all ${getBorderAndBg(
        current.type,
      )}`}
      role="region"
      aria-label="Insight Tático"
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-sm select-none">{current.icon}</span>
          <span className="font-bold text-[11px] uppercase tracking-wider opacity-90 truncate">
            {current.title}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="text-[10px] text-slate-200 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors select-none font-medium ml-2"
          aria-label={collapsed ? 'Expandir insight tático' : 'Ocultar insight tático'}
        >
          {collapsed ? '▼ Ver' : '▲ Ocultar'}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-1 pt-1 border-t border-white/10">
          <p className="text-xs text-white/95 leading-snug font-medium">
            {current.message}
          </p>
        </div>
      )}
    </div>
  );
}
