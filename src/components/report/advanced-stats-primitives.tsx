'use client';

import type { ReactNode } from 'react';
import type { AdvancedMatchStats } from '@/core/report/compute-stats';
import { usePlayerColors } from '@/components/ui/player-color.context';

export interface AdvancedStatsSectionProps {
  stats: AdvancedMatchStats;
  player1Name: string;
  player2Name: string;
}

export function StatRow({ label, p1, p2, format = 'number', tone = 'default' }: {
  label: string;
  p1: number | string;
  p2: number | string;
  format?: 'number' | 'pct';
  /** 'error' reserva o vermelho para métricas de falha real (ENF, Duplas Faltas). */
  tone?: 'default' | 'error';
}) {
  const colors = usePlayerColors();
  const fmt = (v: number | string) => (format === 'pct' ? `${Number(v).toFixed(1)}%` : String(v));
  const p1Class = tone === 'error' ? 'text-telemetry-error' : colors.p1;
  const p2Class = tone === 'error' ? 'text-telemetry-error' : colors.p2;
  return (
    <div className="grid grid-cols-[1fr_minmax(180px,280px)_1fr] sm:grid-cols-[1fr_280px_1fr] gap-3 sm:gap-4 items-center py-1.5 border-b border-white/5 last:border-0">
      <span className={`text-right font-mono text-sm ${p1Class}`}>{fmt(p1)}</span>
      <span className="text-xs text-telemetry-text-muted text-center px-1 leading-snug">{label}</span>
      <span className={`font-mono text-sm ${p2Class}`}>{fmt(p2)}</span>
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
export function PlayerColumnHeader({ player1Name, player2Name, centerLabel }: {
  player1Name: string;
  player2Name: string;
  centerLabel?: string;
}) {
  const colors = usePlayerColors();
  return (
    <div className="grid grid-cols-[1fr_minmax(180px,280px)_1fr] sm:grid-cols-[1fr_280px_1fr] gap-3 sm:gap-4 text-xs text-telemetry-text-muted mb-2 px-1 items-center">
      <span className={`text-right truncate ${colors.p1}`}>{player1Name}</span>
      <span className="text-center truncate px-1">{centerLabel}</span>
      <span className={`truncate ${colors.p2}`}>{player2Name}</span>
    </div>
  );
}