import { RankingField } from './ranking-field';

const inputClass = 'h-8 w-full rounded border border-white/10 bg-telemetry-elevated px-1 text-xs text-center text-telemetry-text-primary placeholder-telemetry-text-muted focus:outline-none focus:ring-1 focus:ring-telemetry-volt [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

interface RankingNumberFieldProps {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  ariaLabel?: string;
  onChange: (value: string) => void;
}

/** Input numérico rotulado usado nas subseções de ranking (Posição). */
export function RankingNumberField({ id, label, value, disabled, ariaLabel, onChange }: RankingNumberFieldProps) {
  return (
    <RankingField id={id} label={label}>
      <input
        id={id}
        type="number"
        min="1"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Nº"
        className={inputClass}
      />
    </RankingField>
  );
}
