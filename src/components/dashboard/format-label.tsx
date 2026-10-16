import { getFormatLabel } from '@/core/scoring/format-labels';

interface FormatLabelProps {
  format: string;
}

export function FormatLabel({ format }: FormatLabelProps) {
  return (
    <span className="text-xs text-telemetry-text-muted font-medium text-right whitespace-nowrap">
      {getFormatLabel(format)}
    </span>
  );
}
