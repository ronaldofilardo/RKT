
import { getFormatLabel } from '@/core/scoring/format-labels';

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

interface MatchActionsProps {
  match: any;
  onReport?: (match: any) => void;
  onFinish?: (match: any) => void;
  onDelete?: (match: any) => void;
}

export function MatchActions({ match, onReport, onFinish, onDelete }: MatchActionsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {onReport && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReport(match);
          }}
          className="p-1 rounded text-xs text-telemetry-text-muted hover:text-telemetry-blue hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Ver relatório"
          aria-label="Ver relatório"
        >
          📊
        </button>
      )}
      {match.state === 'IN_PROGRESS' && onFinish && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFinish(match);
          }}
          className="p-1 rounded text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
          title="Encerrar partida"
          aria-label="Encerrar partida"
        >
          ✓
        </button>
      )}
      {(match.state === 'SCHEDULED' || match.state === 'IN_PROGRESS') && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(match);
          }}
          className="p-1 rounded text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors"
          title="Excluir partida"
          aria-label="Excluir partida"
        >
          🗑
        </button>
      )}
    </div>
  );
}

interface FormatLabelProps {
  format: string;
}

export function FormatLabel({ format }: FormatLabelProps) {
  return (
    <span className="text-xs text-telemetry-text-muted font-medium">
      Modo de jogo: {getFormatLabel(format)}
    </span>
  );
}



