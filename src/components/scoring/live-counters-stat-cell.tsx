import type { ReactNode } from 'react';

export interface StatSide {
  value: ReactNode;
  title: string;
}

export function StatCell({
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
    <div className="bg-telemetry-elevated/70 rounded px-1 py-0.5 border border-white/5 antialiased">
      <span className="text-[10px] text-telemetry-text-muted block font-medium leading-tight">{label}</span>
      <div className="flex justify-around items-center font-sans font-semibold text-xs tabular-nums tracking-normal">
        <span className={p1Class} title={p1.title}>{p1.value}</span>
        <span className="text-telemetry-text-muted/50 text-[10px] mx-0.5">:</span>
        <span className={p2Class} title={p2.title}>{p2.value}</span>
      </div>
    </div>
  );
}
