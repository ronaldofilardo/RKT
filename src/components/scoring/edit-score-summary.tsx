import type { Player } from './edit-score-logic';

interface SetsSummaryProps {
  title: string;
  sets: Array<{
    p1Games: number;
    p2Games: number;
    winner: Player | null;
  }>;
  playerNames: { p1: string; p2: string };
  startIndex?: number;
}

export function SetsSummary({ title, sets, playerNames, startIndex = 0 }: SetsSummaryProps) {
  if (sets.length === 0) return null;

  // Bug #3 (2026-08-07): alinhar estilo ao padrão do ScoreboardCard (dark bg,
  // highlight do vencedor em roxo/cinza, font-mono). Antes usava estilo claro.
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-1.5 rounded-lg border border-white/5 bg-gray-700/50 px-3 py-2">
        {sets.map((set, idx) => {
          const isWinnerP1 = set.winner === 'player1';
          const isWinnerP2 = set.winner === 'player2';
          const p1CellClass = isWinnerP1
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP2
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'text-gray-300';
          const p2CellClass = isWinnerP2
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP1
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : 'text-gray-300';
          return (
            <div
              key={idx}
              className="flex items-center gap-3 text-sm"
            >
              <span className="text-gray-500 w-14 font-medium text-xs">Set {startIndex + idx + 1}</span>
              <span className={`font-mono font-semibold px-2 py-1 rounded ${p1CellClass}`}>
                {set.p1Games}
              </span>
              <span className="text-gray-400">×</span>
              <span className={`font-mono font-semibold px-2 py-1 rounded ${p2CellClass}`}>
                {set.p2Games}
              </span>
              <span
                className={`text-xs font-semibold ${isWinnerP1 ? 'text-sky-600 dark:text-sky-400' : isWinnerP2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}
              >
                {isWinnerP1 ? playerNames.p1 : isWinnerP2 ? playerNames.p2 : 'Em andamento'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EditableSet {
  p1Games: number;
  p2Games: number;
  winner: Player | null;
  index: number;
  isPartial: boolean;
}

interface EditableSetsSummaryProps {
  title: string;
  sets: EditableSet[];
  playerNames: { p1: string; p2: string };
  startIndex?: number;
  onEditSet: (index: number, p1Games: number, p2Games: number) => void;
  onRemoveSet: (index: number) => void;
  validationErrors?: Record<number, string>;
}

export function EditableSetsSummary({ title, sets, playerNames, startIndex = 0, onEditSet, onRemoveSet, validationErrors }: EditableSetsSummaryProps) {
  if (sets.length === 0) return null;

  // Bug #3 (2026-08-07): alinhar estilo ao padrão do ScoreboardCard (dark bg,
  // highlight do vencedor em roxo/cinza, font-mono). Antes usava estilo claro
  // (bg-gray-50, text-gray-700) que destoava da tela ao vivo.
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-1.5 rounded-lg border border-white/5 bg-gray-700/50 px-3 py-2">
        {sets.map((set, idx) => {
          const isWinnerP1 = set.winner === 'player1';
          const isWinnerP2 = set.winner === 'player2';
          const hasValidationError = Boolean(validationErrors?.[set.index]);
          const p1CellClass = isWinnerP1
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP2
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : hasValidationError
                ? 'bg-gray-700 border border-red-500 text-white'
                : 'bg-gray-700 border border-white/10 text-white';
          const p2CellClass = isWinnerP2
            ? 'bg-purple-700 text-white font-bold'
            : isWinnerP1
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              : hasValidationError
                ? 'bg-gray-700 border border-red-500 text-white'
                : 'bg-gray-700 border border-white/10 text-white';
          return (
            <div
              key={idx}
              className="flex items-center gap-3 text-sm"
            >
              <span className="text-gray-500 w-14 font-medium text-xs">Set {startIndex + idx + 1}</span>
              <input
                type="number"
                value={set.p1Games}
                onChange={(e) => onEditSet(set.index, parseInt(e.target.value, 10) || 0, set.p2Games)}
                className={`w-16 text-center rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${p1CellClass}`}
              />
              <span className="text-gray-400">×</span>
              <input
                type="number"
                value={set.p2Games}
                onChange={(e) => onEditSet(set.index, set.p1Games, parseInt(e.target.value, 10) || 0)}
                className={`w-16 text-center rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 ${p2CellClass}`}
              />
              <span
                className={`text-xs font-semibold min-w-[80px] ${isWinnerP1 ? 'text-sky-600 dark:text-sky-400' : isWinnerP2 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}
              >
                {isWinnerP1 ? playerNames.p1 : isWinnerP2 ? playerNames.p2 : 'Em andamento'}
              </span>
              {hasValidationError && <span className="text-xs text-red-400 ml-1" title={validationErrors?.[set.index]}>!</span>}
              {sets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveSet(set.index)}
                  className="text-red-500 hover:text-red-700 text-xs ml-2"
                  title="Remover set"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface MatchSummaryProps {
  playerNames: { p1: string; p2: string };
  p1SetsWon: number;
  p2SetsWon: number;
  setsToWin: number;
}

export function MatchSummary({ playerNames, p1SetsWon, p2SetsWon, setsToWin }: MatchSummaryProps) {
  if (p1SetsWon === 0 && p2SetsWon === 0) return null;

  const matchEnded = p1SetsWon >= setsToWin || p2SetsWon >= setsToWin;
  const winner = p1SetsWon >= setsToWin ? playerNames.p1 : p2SetsWon >= setsToWin ? playerNames.p2 : null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-center gap-4 text-sm font-semibold text-gray-700">
        <span>{playerNames.p1}</span>
        <span className="text-lg font-mono text-gray-900">
          {p1SetsWon} — {p2SetsWon}
        </span>
        <span>{playerNames.p2}</span>
      </div>
      {matchEnded ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 text-center">
          {winner} venceu a partida
        </div>
      ) : null}
    </div>
  );
}