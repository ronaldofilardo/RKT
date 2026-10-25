'use client';

import type { ReactNode } from 'react';
import type { AdvancedMatchStats } from '@/core/report/compute-stats';

export interface AdvancedStatsSectionProps {
  stats: AdvancedMatchStats;
  player1Name: string;
  player2Name: string;
}

export function StatRow({ label, p1, p2, format = 'number' }: {
  label: string;
  p1: number | string;
  p2: number | string;
  format?: 'number' | 'pct';
}) {
  const fmt = (v: number | string) => (format === 'pct' ? `${Number(v).toFixed(1)}%` : String(v));
  return (
    <div className="grid grid-cols-[1fr_140px_1fr] gap-2 items-center py-1 border-b border-white/5 last:border-0">
      <span className="text-right font-mono text-sm text-telemetry-blue">{fmt(p1)}</span>
      <span className="text-xs text-telemetry-text-muted text-center w-[140px] truncate">{label}</span>
      <span className="font-mono text-sm text-telemetry-error">{fmt(p2)}</span>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-telemetry-elevated rounded-xl border border-white/10 p-4 mb-4">
      <h3 className="text-sm font-bold text-telemetry-text-primary uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

/** Cabeçalho das colunas de valores (J1, rótulo central, J2). */
export function PlayerColumnHeader({ player1Name, player2Name }: {
  player1Name: string;
  player2Name: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_140px_1fr] gap-2 text-xs text-telemetry-text-muted mb-2 px-1 items-center">
      <span className="text-right truncate">{player1Name}</span>
      <span className="text-center w-[140px]"></span>
      <span className="truncate">{player2Name}</span>
    </div>
  );
}
