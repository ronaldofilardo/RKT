interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ACTIVE_CLASS = 'bg-white/10 text-telemetry-text-primary border-white/20';
const INACTIVE_CLASS = 'bg-telemetry-elevated text-telemetry-text-muted border-white/10';

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
        active ? ACTIVE_CLASS : INACTIVE_CLASS
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}