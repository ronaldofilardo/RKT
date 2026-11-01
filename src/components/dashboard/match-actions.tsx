import Image from 'next/image';
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
          type="button"
          data-testid={`match-card-share-${match.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onShare(match);
          }}
          className="inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none rounded cursor-pointer"
          title="Compartilhar transmissão"
          aria-label="Compartilhar transmissão"
        >
          <Image
            src="/icons/compartilhar.webp"
            alt="Compartilhar transmissão"
            width={38}
            height={28}
            className="h-7 w-auto object-contain drop-shadow-sm"
          />
        </button>
      )}
      {onReport && (
        <button
          type="button"
          data-testid={`match-card-report-${match.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onReport(match);
          }}
          className="inline-flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none rounded cursor-pointer"
          title="Ver relatório"
          aria-label="Ver relatório"
        >
          <Image
            src="/icons/relatorio.webp"
            alt="Ver relatório"
            width={38}
            height={28}
            className="h-7 w-auto object-contain drop-shadow-sm"
          />
        </button>
      )}
      {match.state === 'IN_PROGRESS' && onFinish && (
        <button
          type="button"
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
          type="button"
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
