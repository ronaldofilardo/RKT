interface ScoringHeaderMetaProps {
  formatLabel: string;
  tournamentName?: string | null;
  round?: number | null;
  rightSlot?: React.ReactNode;
}

export function ScoringHeaderMeta({ formatLabel, tournamentName, round, rightSlot }: ScoringHeaderMetaProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-1 text-xs text-white/75 py-0.5 min-h-0 w-full">
      <div className="flex items-center gap-1.5 flex-wrap text-left min-w-0 flex-shrink-0">
        <span className="font-medium text-white/90 tracking-normal whitespace-nowrap">{formatLabel}</span>
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
      {rightSlot && (
        // landscape:hidden: em paisagem o banner migra para o bloco de anotação (ScoringPlayArea).
        // Evita que a linha de metadados reserve espaço e comprima o formato/torneio.
        <div className="min-w-0 flex-1 flex justify-end landscape:hidden">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
