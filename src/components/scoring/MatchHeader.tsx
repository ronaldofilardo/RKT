'use client';

interface MatchHeaderProps {
  elapsedSeconds: number;
  onClose: () => void;
  onEditMatch?: () => void;
  onStats?: () => void;
  onTimeline?: () => void;
  canEdit?: boolean;
  isFinished?: boolean;
}

function formatTime(elapsedSeconds: number): string {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const hours = Math.floor(mins / 60);
  if (hours > 0) {
    return `${hours}h ${mins % 60}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function MatchHeader({ elapsedSeconds, onClose, onEditMatch, onStats, onTimeline, canEdit, isFinished }: MatchHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 dark:bg-slate-900 dark:border-slate-700">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {!isFinished && (
          <button onClick={onClose} className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 -ml-1.5 sm:-ml-2 min-h-[36px] min-w-[36px] flex items-center justify-center" aria-label="Fechar">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center min-w-0">
          <span className="text-[10px] sm:text-xs font-mono font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {canEdit && onEditMatch && (
            <button onClick={onEditMatch} className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 min-h-[36px] min-w-[36px] flex items-center justify-center" aria-label="Editar partida">
              <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onStats && (
            <button onClick={onStats} className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-base sm:text-lg leading-none min-h-[36px] min-w-[36px] flex items-center justify-center" aria-label="Estatísticas">≡</button>
          )}
          {onTimeline && (
            <button onClick={onTimeline} className="px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 min-h-[32px] dark:text-sky-400 dark:hover:text-sky-300 dark:bg-sky-900/20 dark:border-sky-800 dark:hover:bg-sky-900/30">
              📊
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
