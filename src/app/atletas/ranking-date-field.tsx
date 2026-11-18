interface RankingDateFieldProps {
  id: string;
  value?: string | null;
  disabled: boolean;
  onChange: (value: string) => void;
}

export function RankingDateField({ id, value, disabled, onChange }: RankingDateFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-telemetry-text-muted mb-1">
        Data do Ranking
      </label>
      <input
        type="date"
        id={id}
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary text-xs [color-scheme:dark]"
      />
    </div>
  );
}
