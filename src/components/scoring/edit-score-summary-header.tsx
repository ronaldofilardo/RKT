interface SetsSummaryHeaderProps {
  playerNames: { p1: string; p2: string };
}

/** Cabeçalho de colunas dos jogadores (Set | P1 × P2 | Vencedor). */
export function SetsSummaryHeader({ playerNames }: SetsSummaryHeaderProps) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-xs font-semibold text-telemetry-text-muted">
      <span className="w-12 sm:w-14">Set</span>
      <div className="flex-1 flex items-center justify-center gap-2">
        <span className="w-16 sm:w-20 text-center truncate text-telemetry-text-primary font-bold" title={playerNames.p1}>{playerNames.p1}</span>
        <span className="w-3 text-center opacity-30">×</span>
        <span className="w-16 sm:w-20 text-center truncate text-telemetry-text-primary font-bold" title={playerNames.p2}>{playerNames.p2}</span>
      </div>
      <span className="w-20 sm:w-28 text-right text-[11px] font-medium text-telemetry-text-muted">Vencedor</span>
    </div>
  );
}
