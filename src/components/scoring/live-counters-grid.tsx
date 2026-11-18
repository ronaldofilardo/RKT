'use client';

import type { LiveMatchCounters } from '@/core/scoring/live-tactical-insights';
import { buildLiveStatItems } from './live-counters-items';

interface LiveCountersGridProps {
  counters: LiveMatchCounters;
  p1Short: string;
  p2Short: string;
  p1IsServing?: boolean;
  p2IsServing?: boolean;
}

export function LiveCountersGrid({
  counters,
  p1Short,
  p2Short,
  p1IsServing,
  p2IsServing,
}: LiveCountersGridProps) {
  const p1Class = p1IsServing ? 'text-telemetry-volt' : 'text-telemetry-text-primary';
  const p2Class = p2IsServing ? 'text-telemetry-volt' : 'text-telemetry-text-primary';

  const statItems = buildLiveStatItems({
    counters,
    p1Short,
    p2Short,
    p1Class,
    p2Class,
  });

  if (statItems.length === 0) return null;

  return (
    <div
      className="grid gap-1 sm:gap-2 text-center mt-0.5 pt-0.5 border-t border-white/5"
      style={{ gridTemplateColumns: `repeat(${statItems.length}, minmax(0, 1fr))` }}
    >
      {statItems}
    </div>
  );
}
