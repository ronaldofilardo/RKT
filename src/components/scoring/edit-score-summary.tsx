export { SetsSummary, EditableSetsSummary } from './edit-score-summary.sets';

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