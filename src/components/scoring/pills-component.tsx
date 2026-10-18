interface PillsProps<T extends string> {
  options: T[];
  selected: T | null;
  onChange: (v: T) => void;
  labelMap: Record<T, string>;
  btnBase?: string;
  btnNormal?: string;
  btnActive?: string;
}

/**
 * `Object.fromEntries` devolve `{[k: string]: string}` e não infere a união de
 * chaves. Este helper preserva o tipo de `value` no `Record` resultante.
 */
export function toLabelMap<T extends string>(
  options: readonly { value: T; label: string }[],
): Record<T, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<T, string>;
}

const defaultBtnBase = 'px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-all select-none min-h-[44px] active:scale-[0.97]';
const defaultBtnNormal = 'bg-telemetry-elevated border-white/10 text-telemetry-text-muted hover:border-white/20 hover:text-telemetry-text-primary shadow-sm';
const defaultBtnActive = 'bg-telemetry-blue/20 border-telemetry-blue text-telemetry-blue-light shadow-telemetry-blue ring-1 ring-telemetry-blue/50 font-bold';

export function Pills<T extends string>({
  options,
  selected,
  onChange,
  labelMap,
  btnBase = defaultBtnBase,
  btnNormal = defaultBtnNormal,
  btnActive = defaultBtnActive,
}: PillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`${btnBase} ${selected === opt ? btnActive : btnNormal}`}
        >
          {labelMap[opt]}
        </button>
      ))}
    </div>
  );
}