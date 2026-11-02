import { RankingField } from './ranking-field';

const inputClass = 'h-8 w-full rounded border border-white/10 bg-telemetry-elevated px-2 text-xs text-telemetry-text-primary placeholder-telemetry-text-muted focus:outline-none focus:ring-1 focus:ring-telemetry-volt';

interface RankingNumberFieldProps {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** Input numérico rotulado usado nas subseções de ranking (Posição). */
export function RankingNumberField({ id, label, value, disabled, onChange }: RankingNumberFieldProps) {
  return (
    <RankingField id={id} label={label}>
      <input
        id={id}
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Posição"
        className={inputClass}
      />
    </RankingField>
  );
}
