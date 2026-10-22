import { getFormatLabel } from '@/core/scoring/format-labels';

interface FormatLabelProps {
  format: string;
  matchType?: string;
}

export function FormatLabel({ format, matchType }: FormatLabelProps) {
  const isDoubles = matchType === 'DOUBLES';
  return (
    <span className="text-xs text-telemetry-text-muted font-medium text-right whitespace-nowrap">
      {isDoubles ? `Duplas · ${getFormatLabel(format)}` : getFormatLabel(format)}
    </span>
  );
}
