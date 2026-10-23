import type { EditMatchInfoFormValues } from './edit-match-info-submission';

export type Change = <K extends keyof EditMatchInfoFormValues>(
  key: K,
  value: EditMatchInfoFormValues[K]
) => void;

export interface SectionProps {
  values: EditMatchInfoFormValues;
  onChange: Change;
}

export const SECTION_TITLE_CLASS =
  'text-xs font-bold uppercase tracking-wider text-telemetry-text-muted mb-2';

export const GRID_2 = 'grid grid-cols-2 gap-3';
