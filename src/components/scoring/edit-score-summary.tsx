import type { Player } from './edit-score-logic';

interface SetsSummaryProps {
  title: string;
  sets: Array<{
    p1Games: number;
    p2Games: number;
    winner: Player;
  }>;
  playerNames: { p1: string; p2: string };
  startIndex?: number;
}

export function SetsSummary({ title, sets, playerNames, startIndex = 0 }: SetsSummaryProps) {
  if (sets.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        {title}
      </p>
      {sets.map((set, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 text-sm text-gray-200"
        >
          <span className="text-gray-500 w-14">Set {startIndex + idx + 1}</span>
          <span className="font-mono font-semibold">
            {set.p1Games}x{set.p2Games}
          </span>
          <span
            className={`text-xs font-semibold ${set.winner === 'player1' ? 'text-blue-400' : 'text-emerald-400'}`}
          >
            {set.winner === 'player1' ? playerNames.p1 : playerNames.p2}
          </span>
        </div>
      ))}
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
      <div className="flex items-center justify-center gap-4 text-sm font-semibold text-gray-200">
        <span>{playerNames.p1}</span>
        <span className="text-lg font-mono">
          {p1SetsWon} — {p2SetsWon}
        </span>
        <span>{playerNames.p2}</span>
      </div>
      {matchEnded ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-300 text-center">
          {winner} venceu a partida
        </div>
      ) : (
        <div className="bg-gray-750 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400 text-center">
          Faltam {setsToWin - p1SetsWon} sets para {playerNames.p1} | Faltam {setsToWin - p2SetsWon} sets para {playerNames.p2}
        </div>
      )}
    </div>
  );
}