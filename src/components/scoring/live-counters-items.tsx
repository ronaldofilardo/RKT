import type { ReactNode } from 'react';
import type { LiveMatchCounters } from '@/core/scoring/live-tactical-insights';
import { StatCell } from './live-counters-stat-cell';

interface BuildStatItemsProps {
  counters: LiveMatchCounters;
  p1Short: string;
  p2Short: string;
  p1Class: string;
  p2Class: string;
}

export function buildLiveStatItems({
  counters,
  p1Short,
  p2Short,
  p1Class,
  p2Class,
}: BuildStatItemsProps): ReactNode[] {
  const items: ReactNode[] = [];

  if (counters.aces.p1 > 0 || counters.aces.p2 > 0) {
    items.push(
      <StatCell
        key="aces"
        label="Aces"
        p1Class={p1Class}
        p2Class={p2Class}
        p1={{ value: counters.aces.p1, title: `${p1Short}: ${counters.aces.p1}` }}
        p2={{ value: counters.aces.p2, title: `${p2Short}: ${counters.aces.p2}` }}
      />,
    );
  }

  if (counters.doubleFaults.p1 > 0 || counters.doubleFaults.p2 > 0) {
    items.push(
      <StatCell
        key="df"
        label="Duplas Faltas"
        p1Class={p1Class}
        p2Class={p2Class}
        p1={{ value: counters.doubleFaults.p1, title: `${p1Short}: ${counters.doubleFaults.p1}` }}
        p2={{ value: counters.doubleFaults.p2, title: `${p2Short}: ${counters.doubleFaults.p2}` }}
      />,
    );
  }

  if (counters.breakPoints.p1.total > 0 || counters.breakPoints.p2.total > 0) {
    items.push(
      <StatCell
        key="bp"
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
      />,
    );
  }

  if (
    counters.forcedErrors.p1 > 0 || counters.forcedErrors.p2 > 0 ||
    counters.unforcedErrors.p1 > 0 || counters.unforcedErrors.p2 > 0
  ) {
    items.push(
      <StatCell
        key="errors"
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
      />,
    );
  }

  return items;
}
