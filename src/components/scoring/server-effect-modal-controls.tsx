const btnBase = 'px-1 min-h-[clamp(30px,4.6dvh,44px)] text-[clamp(11px,1.7dvh,14px)] rounded-xl border-2 transition-all select-none';
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
    <div className="grid grid-cols-3 gap-1">
      {options.map(opt => (
        <button
          type="button"
          key={opt.value}
          aria-pressed={selected === opt.value}
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-telemetry-text-muted mb-1">{label}</p>
      {children}
    </div>
  );
}
