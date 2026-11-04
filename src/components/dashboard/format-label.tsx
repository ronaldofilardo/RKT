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

  // Use lighter variants for badge text to meet WCAG AA (4.5:1)
  const badgeTextColor = ct === 'HARD' ? 'rgb(var(--telemetry-blue-light))' : `rgb(var(--telemetry-court-${ct.toLowerCase()}))`;

  return (
    <span className="flex items-center gap-1.5 text-left">
      {courtType && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                backgroundColor: `rgb(var(--telemetry-court-${ct.toLowerCase()}) / var(--court-badge-bg-opacity, 0.12))`,
                color: badgeTextColor,
              }}>
        {courtLabel}
      </span>
      )}
      <span className="text-xs text-telemetry-text-muted font-medium">
        {isDoubles ? `Duplas · ${getFormatLabel(format)}` : getFormatLabel(format)}
      </span>
    </span>
  );
}
