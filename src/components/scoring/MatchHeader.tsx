'use client';

interface SetScore {
  player1: number;
  player2: number;
  isTiebreak: boolean;
  tiebreakScore: { player1: number; player2: number } | null;
}

interface MatchHeaderProps {
  sportType?: string;
  elapsedSeconds: number;
  completedSets: SetScore[];
  onClose: () => void;
  onEditMatch?: () => void;
  onStats?: () => void;
  onTimeline?: () => void;
  canEdit?: boolean;
  isFinished?: boolean;
}

function formatSetBadge(set: SetScore, index: number): string {
  if (set.isTiebreak && set.tiebreakScore) {
    const winnerGames = Math.max(set.player1, set.player2);
    const loserGames = Math.min(set.player1, set.player2);
    const loserTb = Math.min(set.tiebreakScore.player1, set.tiebreakScore.player2);
    return `${winnerGames}x${loserGames}(${loserTb})`;
  }
  return `${set.player1}x${set.player2}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MatchHeader({ sportType, elapsedSeconds, completedSets, onClose, onEditMatch, onStats, onTimeline, canEdit, isFinished }: MatchHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        {!isFinished && (
          <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-900 -ml-2" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          {completedSets.length > 0 && (
            <div className="flex gap-1 overflow-x-auto">
              {completedSets.map((set, i) => {
                const isP1Winner = set.player1 > set.player2;
                return (
                  <span
                    key={i}
                    className={`text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                      isP1Winner ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {formatSetBadge(set, i)}
                  </span>
                );
              })}
            </div>
          )}

          <span className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{sportType || 'TÊNIS'}</span>
          {elapsedSeconds > 0 && (
            <span className="text-xs font-mono text-gray-500 whitespace-nowrap">⏱ {formatTime(elapsedSeconds)}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {canEdit && onEditMatch && (
            <button onClick={onEditMatch} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Editar partida">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onStats && (
            <button onClick={onStats} className="p-2 text-gray-500 hover:text-gray-700 text-lg leading-none" aria-label="Estatísticas">≡</button>
          )}
          {onTimeline && (
            <button onClick={onTimeline} className="px-2 py-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200">
              📊
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
