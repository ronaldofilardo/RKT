'use client';

import type { ReportData } from '@/app/match/[id]/report/report.types';
import type { AdvancedMatchStats } from '@/core/report/compute-stats';

interface HeaderProps {
  report?: ReportData;
  stats: AdvancedMatchStats;
  player1Name: string;
  player2Name: string;
}

function formatCourtType(c?: string | null): string {
  if (!c) return 'Não informado';
  const upper = c.toUpperCase();
  if (upper === 'CLAY') return 'Saibro';
  if (upper === 'GRASS') return 'Grama';
  if (upper === 'HARD') return 'Rápida';
  return c;
}

export function AdvancedStatsHeader({ report, stats, player1Name, player2Name }: HeaderProps) {
  if (!report) return null;

  const mode = report.matchType === 'DOUBLES' ? 'Duplas' : 'Simples';
  const event = report.tournamentName || report.clubName || 'Partida Avulsa';
  const categoryRound = [report.category, report.round].filter(Boolean).join(' • ');
  const court = formatCourtType(report.courtType);
  const totalMin = stats.durations?.totalDurationMinutes ?? 0;
  const effectiveMin = stats.durations?.effectiveDurationMinutes ?? 0;
  const secPerPoint = stats.durations?.effectiveSecondsPerPoint ?? 0;

  const weather = [
    report.temperature != null ? `${report.temperature}°C` : null,
    report.humidity != null ? `${report.humidity}% umid.` : null,
  ].filter(Boolean).join(', ');

  return (
    <div className="bg-telemetry-elevated rounded-xl border border-white/10 p-4 mb-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
        <div>
          <span className="font-bold text-sm text-telemetry-text-primary mr-2">{player1Name}</span>
          <span className="text-telemetry-text-muted">vs</span>
          <span className="font-bold text-sm text-telemetry-text-primary ml-2">{player2Name}</span>
        </div>
        <div className="text-telemetry-blue font-semibold uppercase tracking-wider text-[11px]">
          {mode} &bull; {report.format}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-telemetry-text-muted">
        <div>
          <div className="text-[10px] uppercase font-bold text-white/50">Evento</div>
          <div className="text-white font-medium truncate">{event}</div>
          {categoryRound && <div className="text-[11px] text-white/70">{categoryRound}</div>}
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-white/50">Piso & Clima</div>
          <div className="text-white font-medium">{court}</div>
          {weather && <div className="text-[11px] text-white/70">{weather}</div>}
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-white/50">Tempo Total</div>
          <div className="text-white font-mono font-bold text-sm">{totalMin > 0 ? `${totalMin} min` : '-'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-white/50">Tempo Efetivo (est.)</div>
          <div className="text-white font-mono font-bold text-sm">
            {effectiveMin > 0 ? `${effectiveMin} min` : '-'}
          </div>
          {secPerPoint > 0 && (
            <div className="text-[11px] text-white/70 font-mono">{secPerPoint}s / ponto</div>
          )}
        </div>
      </div>
    </div>
  );
}
