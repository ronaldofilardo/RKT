import { RankingField } from './ranking-field';

const selectClass = 'h-8 w-full rounded border border-white/10 bg-telemetry-elevated px-2 text-xs text-telemetry-text-primary focus:outline-none focus:ring-1 focus:ring-telemetry-volt';

interface RankingSelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  /** Sufixo do texto da opção (ex.: " anos" para categorias). */
  optionSuffix?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

/** Select rotulado usado nas subseções de ranking (Categoria/Classe). */
export function RankingSelectField({ id, label, value, options, optionSuffix, disabled, onChange }: RankingSelectFieldProps) {
  return (
    <RankingField id={id} label={label}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectClass}
      >
        <option value="">Selecione...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}{optionSuffix ?? ''}</option>
        ))}
      </select>
    </RankingField>
  );
}
