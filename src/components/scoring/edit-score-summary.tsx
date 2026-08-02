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

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        {sets.map((set, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 text-sm text-gray-700"
          >
            <span className="text-gray-500 w-14 font-medium">Set {startIndex + idx + 1}</span>
            <span className="font-mono font-semibold text-gray-900">
              {set.p1Games}x{set.p2Games}
            </span>
            <span
              className={`text-xs font-semibold ${set.winner === 'player1' ? 'text-sky-700' : set.winner === 'player2' ? 'text-emerald-700' : 'text-gray-500'}`}
            >
              {set.winner === 'player1' ? playerNames.p1 : set.winner === 'player2' ? playerNames.p2 : 'Em andamento'}
            </span>
          </div>
        ))}
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
}

export function EditableSetsSummary({ title, sets, playerNames, startIndex = 0, onEditSet, onRemoveSet }: EditableSetsSummaryProps) {
  if (sets.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </p>
      <div className="space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        {sets.map((set, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 text-sm text-gray-700"
          >
            <span className="text-gray-500 w-14 font-medium">Set {startIndex + idx + 1}</span>
            <input
              type="number"
              min={0}
              max={50}
              value={set.p1Games}
              onChange={(e) => onEditSet(set.index, parseInt(e.target.value, 10) || 0, set.p2Games)}
              className="w-16 text-center bg-white border rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">×</span>
            <input
              type="number"
              min={0}
              max={50}
              value={set.p2Games}
              onChange={(e) => onEditSet(set.index, set.p1Games, parseInt(e.target.value, 10) || 0)}
              className="w-16 text-center bg-white border rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span
              className={`text-xs font-semibold ${set.winner === 'player1' ? 'text-sky-700' : set.winner === 'player2' ? 'text-emerald-700' : 'text-gray-500'} min-w-[80px]`}
            >
              {set.winner === 'player1' ? playerNames.p1 : set.winner === 'player2' ? playerNames.p2 : 'Em andamento'}
            </span>
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
        ))}
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