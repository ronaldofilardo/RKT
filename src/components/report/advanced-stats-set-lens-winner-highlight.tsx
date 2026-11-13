// Destaque animado do vencedor do set (Set Lens)
interface SetLensWinnerHighlightProps {
  selectedSet: number;
  winnerName: string;
  scoreText: string;
  p1Games: number;
  p2Games: number;
  duration?: number | null;
}

export function SetLensWinnerHighlight({
  selectedSet,
  winnerName,
  scoreText,
  p1Games,
  p2Games,
  duration,
}: SetLensWinnerHighlightProps) {
  if (!winnerName) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 mb-4 text-xs text-telemetry-text-muted text-center">
        Set {selectedSet} em andamento ou empatado ({p1Games}x{p2Games})
      </div>
    );
  }

  return (
    <div
      data-testid="set-winner-highlight"
      className="relative overflow-hidden rounded-xl border border-telemetry-volt/40 bg-gradient-to-r from-telemetry-volt/15 via-telemetry-volt/5 to-transparent p-3.5 mb-5 shadow-[0_0_20px_rgba(204,255,0,0.12)] flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        {/* Indicador pulsante animado */}
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-telemetry-volt opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-telemetry-volt shadow-[0_0_8px_#CCFF00]" />
        </span>
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-telemetry-text-muted flex items-center gap-1.5">
            <span>Vencedor do Set {selectedSet}</span>
            <span className="inline-block animate-pulse text-telemetry-volt font-black">● VITORIOSO</span>
          </div>
          <div className="text-base sm:text-lg font-black text-telemetry-text-primary flex items-center gap-2">
            <span>🏆 {winnerName}</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-telemetry-volt animate-pulse">
          {scoreText}
        </div>
        {duration != null && (
          <div className="text-[10px] text-telemetry-text-muted font-mono">
            ⏱️ {duration} min
          </div>
        )}
      </div>
    </div>
  );
}
