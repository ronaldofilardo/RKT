'use client';

import { formatMatchScheduleDate } from './match-schedule-format.logic';

interface MatchCardFinishedFooterProps {
  match: { scheduledAt?: string | null };
}

export function MatchCardFinishedFooter({ match }: MatchCardFinishedFooterProps) {
  const formatted = formatMatchScheduleDate(match.scheduledAt);

  return (
    <div className="px-4 pb-2.5 pt-1.5 flex items-center justify-between text-xs font-medium text-telemetry-text-muted border-t border-telemetry-border/10 mt-1">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-telemetry-volt">
        <span aria-hidden="true" className="font-black text-sm">✓</span> Partida Finalizada
      </span>
      {formatted && (
        <span className="text-xs text-telemetry-text-muted/70">
          📅 {formatted}
        </span>
      )}
    </div>
  );
}
