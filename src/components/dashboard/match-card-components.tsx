import { getSinglePointDisplay } from './match-card-utils';
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

interface ScoreDisplayProps {
  scoreState: any;
  format: string;
  isSuspended: boolean;
}

export function ScoreDisplay({ scoreState, format, isSuspended }: ScoreDisplayProps) {
  const isMatchTiebreak = format === 'MATCH_TB_10' || format === 'BEST_OF_3_MATCH_TB';
  const textColor = isSuspended ? 'text-amber-700 dark:text-amber-300' : 'text-telemetry-text-primary';

  if (!scoreState?.sets || scoreState.sets.length === 0) {
    return (
      <div className="grid grid-cols-[1.5rem_2.5rem] gap-x-1 text-[10px] text-telemetry-text-muted">
        <span></span>
        <span className="text-center">Pontos</span>
      </div>
    );
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${scoreState.sets.length}, 1.5rem) 2.5rem`,
        gridTemplateRows: 'auto auto 2rem 2rem',
        rowGap: '0.125rem',
      }}
    >
      <span className="text-[10px] text-telemetry-text-muted text-center" style={{ gridColumn: `1 / ${scoreState.sets.length + 1}` }}>
        Sets
      </span>
      <span></span>

      {scoreState.sets.map((_: any, idx: number) => (
        <span key={idx} className="text-[10px] text-telemetry-text-muted text-center">
          {idx + 1}
        </span>
      ))}
      <span className="text-[10px] text-telemetry-text-muted text-center">Pontos</span>

      {scoreState.sets.map((s: any, idx: number) => {
        let displayScore = s.player1 ?? 0;
        if (s.isTiebreak && s.tiebreakScore) {
          displayScore = s.tiebreakScore.player1;
        } else if (isMatchTiebreak && idx === 0) {
          displayScore = s.player1 ?? 0;
        }
        return (
          <span key={idx} className={`text-sm flex items-center justify-center ${textColor}`}>
            {displayScore}
          </span>
        );
      })}
      <span className={`text-sm flex items-center justify-center ${textColor}`}>
        {isMatchTiebreak && scoreState.sets.length > 0
          ? '-'
          : getSinglePointDisplay(scoreState?.currentGame, 'player1')}
      </span>

      {scoreState.sets.map((s: any, idx: number) => {
        let displayScore = s.player2 ?? 0;
        if (s.isTiebreak && s.tiebreakScore) {
          displayScore = s.tiebreakScore.player2;
        } else if (isMatchTiebreak && idx === 0) {
          displayScore = s.player2 ?? 0;
        }
        return (
          <span key={idx} className={`text-sm flex items-center justify-center ${textColor}`}>
            {displayScore}
          </span>
        );
      })}
      <span className={`text-sm flex items-center justify-center ${textColor}`}>
        {isMatchTiebreak && scoreState.sets.length > 0
          ? '-'
          : getSinglePointDisplay(scoreState?.currentGame, 'player2')}
      </span>
    </div>
  );
}