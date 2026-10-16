const btnBase = 'px-3 py-2 text-sm rounded-xl border-2 transition-all select-none';
const btnNormal = 'bg-telemetry-elevated border-white/10 text-telemetry-text-muted hover:border-white/20 hover:text-telemetry-text-primary';
const btnActive = 'bg-telemetry-volt/10 border-telemetry-volt text-telemetry-volt shadow-[0_0_8px_rgba(204,255,0,0.3)]';

export const EFFECT_OPTIONS = [
  { value: 'topspin', label: 'TopSpin' },
  { value: 'slice', label: 'Slice' },
  { value: 'flat', label: 'Flat' },
] as const;

export const DIRECTION_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'centro', label: 'Centro' },
  { value: 'fechado', label: 'Fechado' },
] as const;

export function PillGroup({ options, selected, onChange }: {
  options: readonly { value: string; label: string }[];
  selected: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`${btnBase} ${selected === opt.value ? btnActive : btnNormal}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-telemetry-text-muted mb-2">{label}</p>
      {children}
    </div>
  );
}
