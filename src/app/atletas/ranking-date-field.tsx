import { RankingField } from './ranking-field';

interface RankingDateFieldProps {
  id: string;
  value?: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
  label?: string;
}

export function RankingDateField({ id, value, disabled, onChange, label = 'Data da consulta' }: RankingDateFieldProps) {
  return (
    <RankingField id={id} label={label}>
      <input
        type="date"
        id={id}
        aria-label={label}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded border border-white/10 bg-telemetry-elevated px-2 text-xs text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-volt [color-scheme:dark]"
      />
    </RankingField>
  );
}
