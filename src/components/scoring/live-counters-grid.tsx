'use client';

import type { LiveMatchCounters } from '@/core/scoring/live-tactical-insights';

interface StatSide {
  value: React.ReactNode;
  title: string;
}

function StatCell({
  label,
  p1,
  p2,
  p1Class,
  p2Class,
}: {
  label: string;
  p1: StatSide;
  p2: StatSide;
  p1Class: string;
  p2Class: string;
}) {
  return (
    <div className="bg-telemetry-elevated/70 rounded px-1 py-0.5 border border-white/5">
      <span className="text-[10px] text-telemetry-text-muted block font-medium">{label}</span>
      <div className="flex justify-around items-center font-space-grotesk font-bold text-xs">
        <span className={p1Class} title={p1.title}>{p1.value}</span>
        <span className="text-telemetry-text-muted/60 text-[10px]">:</span>
        <span className={p2Class} title={p2.title}>{p2.value}</span>
      </div>
    </div>
  );
}

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

  return (
    <div className="grid grid-cols-4 gap-1 sm:gap-2 text-center mt-0.5 pt-0.5 border-t border-white/5">
      <StatCell
        label="Aces"
        p1Class={p1Class}
        p2Class={p2Class}
        p1={{ value: counters.aces.p1, title: `${p1Short}: ${counters.aces.p1}` }}
        p2={{ value: counters.aces.p2, title: `${p2Short}: ${counters.aces.p2}` }}
      />
      <StatCell
        label="Duplas Faltas"
        p1Class={p1Class}
        p2Class={p2Class}
        p1={{ value: counters.doubleFaults.p1, title: `${p1Short}: ${counters.doubleFaults.p1}` }}
        p2={{ value: counters.doubleFaults.p2, title: `${p2Short}: ${counters.doubleFaults.p2}` }}
      />
      <StatCell
        label="Break Points"
        p1Class={p1Class}
        p2Class={p2Class}
        p1={{
          value: `${counters.breakPoints.p1.converted}/${counters.breakPoints.p1.total}`,
          title: `${p1Short}: ${counters.breakPoints.p1.converted}/${counters.breakPoints.p1.total}`,
        }}
        p2={{
          value: `${counters.breakPoints.p2.converted}/${counters.breakPoints.p2.total}`,
          title: `${p2Short}: ${counters.breakPoints.p2.converted}/${counters.breakPoints.p2.total}`,
        }}
      />
      <StatCell
        label="EF / ENF"
        p1Class={p1Class}
        p2Class={p2Class}
        p1={{
          value: `${counters.forcedErrors.p1}/${counters.unforcedErrors.p1}`,
          title: `${p1Short}: ${counters.forcedErrors.p1} EF / ${counters.unforcedErrors.p1} ENF`,
        }}
        p2={{
          value: `${counters.forcedErrors.p2}/${counters.unforcedErrors.p2}`,
          title: `${p2Short}: ${counters.forcedErrors.p2} EF / ${counters.unforcedErrors.p2} ENF`,
        }}
      />
    </div>
  );
}
