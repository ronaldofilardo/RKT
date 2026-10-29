import { ShareIcon } from '@/components/scoring/share-spectate.icons';
import type { DashboardMatchPayload } from './MatchCard';

interface MatchActionsProps {
  match: DashboardMatchPayload;
  onReport?: (match: DashboardMatchPayload) => void;
  onFinish?: (match: DashboardMatchPayload) => void;
  onDelete?: (match: DashboardMatchPayload) => void;
  onShare?: (match: DashboardMatchPayload) => void;
}

export function MatchActions({ match, onReport, onFinish, onDelete, onShare }: MatchActionsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {onShare && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(match);
          }}
          className="p-1 rounded text-xs text-telemetry-text-muted hover:text-telemetry-blue hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          title="Compartilhar transmissão"
          aria-label="Compartilhar transmissão"
        >
          <ShareIcon className="w-3.5 h-3.5" />
        </button>
      )}
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
