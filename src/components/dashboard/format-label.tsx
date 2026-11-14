import { getFormatLabel } from '@/core/scoring/format-labels';

interface FormatLabelProps {
  format: string;
  matchType?: string;
  courtType?: string;
}

export function FormatLabel({ format, matchType, courtType }: FormatLabelProps) {
  const isDoubles = matchType === 'DOUBLES';
  const ct = courtType ?? 'HARD';
  const courtLabel = ct === 'CLAY' ? 'Saibro' : ct === 'GRASS' ? 'Grama' : 'Dura';

  return (
    <span className="flex items-center gap-1.5 text-left">
      {courtType && (
        <span
          data-court={ct.toLowerCase()}
          className="court-pill inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
        >
          {courtLabel}
        </span>
      )}
      <span className="text-xs text-telemetry-text-primary/80 dark:text-telemetry-text-muted font-medium">
        {isDoubles ? `Duplas · ${getFormatLabel(format)}` : getFormatLabel(format)}
      </span>
    </span>
  );
}
