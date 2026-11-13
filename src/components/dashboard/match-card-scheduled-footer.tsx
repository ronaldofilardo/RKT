'use client';

import { formatMatchScheduleDate } from './match-schedule-format.logic';

interface MatchCardScheduledFooterProps {
  match: { scheduledAt?: string | null; state?: string };
}

export function MatchCardScheduledFooter({ match }: MatchCardScheduledFooterProps) {
  const formatted = formatMatchScheduleDate(match.scheduledAt);
  if (!formatted) return null;

  const isScheduled = match.state === 'SCHEDULED';

  return (
    <div className={`px-4 pb-3 flex items-center gap-1.5 text-xs font-medium ${isScheduled ? 'text-purple-400' : 'text-telemetry-text-muted'}`}>
      <span aria-hidden="true" className={isScheduled ? 'text-purple-400' : 'text-telemetry-text-primary/70'}>
        {isScheduled ? '⏰' : '📅'}
      </span>
      <span>{formatted}</span>
    </div>
  );
}
