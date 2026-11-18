interface ScoringHeaderMetaProps {
  formatLabel: string;
  tournamentName?: string | null;
  round?: number | null;
}

export function ScoringHeaderMeta({ formatLabel, tournamentName, round }: ScoringHeaderMetaProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap text-center px-1 text-xs text-white/75 py-0.5 min-h-0">
      <span className="font-medium text-white/90 tracking-normal">{formatLabel}</span>
      {tournamentName && (
        <>
          <span className="text-white/30" aria-hidden="true">·</span>
          <span className="truncate max-w-[140px] sm:max-w-none">{tournamentName}</span>
        </>
      )}
      {round && (
        <>
          <span className="text-white/30" aria-hidden="true">·</span>
          <span>Rodada {round}</span>
        </>
      )}
    </div>
  );
}
