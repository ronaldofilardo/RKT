const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em Andamento',
  FINISHED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

interface MatchStatusBadgeProps {
  isSuspended: boolean;
  state: string;
}

export function MatchStatusBadge({ isSuspended, state }: MatchStatusBadgeProps) {
  let badgeStyle = "bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30";
  if (isSuspended) {
    badgeStyle = "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30";
  } else if (state === "FINISHED") {
    badgeStyle = "bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200 border border-slate-300 dark:border-white/10";
  } else if (state === "SCHEDULED") {
    badgeStyle = "bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30";
  } else if (state === "IN_PROGRESS") {
    badgeStyle = "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30";
  }

  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeStyle}`}>
      {isSuspended ? "Suspensa" : STATUS_LABELS[state] || state}
    </span>
  );
}
