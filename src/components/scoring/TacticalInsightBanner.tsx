'use client';

import React from 'react';
import type { TacticalInsight } from '@/core/scoring/live-tactical-insights';

interface TacticalInsightBannerProps {
  insights: TacticalInsight[];
}

export function TacticalInsightBanner({ insights }: TacticalInsightBannerProps) {
  if (!insights || insights.length === 0) {
    return null;
  }

  // Mostra o insight de maior prioridade no momento
  const current = insights[0];

  const getBorderAndBg = (type: TacticalInsight['type']) => {
    switch (type) {
      case 'weakness':
        return 'bg-telemetry-card border-amber-500/40 text-amber-200';
      case 'opportunity':
        return 'bg-telemetry-card border-emerald-500/40 text-emerald-200';
      case 'trend':
        return 'bg-telemetry-card border-blue-500/40 text-blue-200';
      case 'alert':
      default:
        return 'bg-telemetry-card border-purple-500/40 text-purple-200';
    }
  };

  return (
    <div
      data-testid="tactical-insight-banner"
      className={`border rounded-lg px-2.5 py-0.5 my-0 shadow-sm text-xs relative z-10 transition-all flex items-center gap-2 overflow-hidden max-w-full ${getBorderAndBg(
        current.type,
      )}`}
      role="region"
      aria-label="Insight Tático"
    >
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs select-none leading-none">{current.icon}</span>
        <span className="font-bold text-[10px] uppercase tracking-wider opacity-90 whitespace-nowrap leading-none">
          {current.title}
        </span>
      </div>
      <p className="text-[11px] text-white/95 leading-none font-medium truncate flex-1 min-w-0">
        {current.message}
      </p>
    </div>
  );
}
