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

  const courtBadgeClasses = ct === 'CLAY'
    ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 font-bold'
    : ct === 'GRASS'
      ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-500/30 font-bold'
      : 'bg-sky-500/15 text-sky-900 dark:text-sky-300 border border-sky-500/30 font-bold';

  return (
    <span className="flex items-center gap-1.5 text-left">
      {courtType && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${courtBadgeClasses}`}>
          {courtLabel}
        </span>
      )}
      <span className="text-xs text-telemetry-text-primary/80 dark:text-telemetry-text-muted font-medium">
        {isDoubles ? `Duplas · ${getFormatLabel(format)}` : getFormatLabel(format)}
      </span>
    </span>
  );
}
