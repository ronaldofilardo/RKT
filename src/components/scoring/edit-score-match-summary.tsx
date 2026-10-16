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
    <div className="space-y-2 pt-1 pb-1">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 rounded-xl bg-telemetry-elevated/40 border border-white/5">
        <span className="text-sm font-bold text-telemetry-text-primary text-center truncate" title={playerNames.p1}>
          {playerNames.p1}
        </span>
        <span className="text-base font-space-grotesk font-bold text-telemetry-volt px-2">
          {p1SetsWon} — {p2SetsWon}
        </span>
        <span className="text-sm font-bold text-telemetry-text-primary text-center truncate" title={playerNames.p2}>
          {playerNames.p2}
        </span>
      </div>
      {matchEnded ? (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-telemetry-volt/15 text-telemetry-volt border border-telemetry-volt/30">
            <span>🏆</span>
            <span>{winner} venceu a partida</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
