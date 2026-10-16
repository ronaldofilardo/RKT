interface ChipProps {
  label: string;
  active: boolean;
  color: 'blue' | 'rose' | 'gray';
  onClick: () => void;
}

const COLOR_MAP = {
  blue: {
    active: 'bg-telemetry-blue/20 text-telemetry-blue-light border-telemetry-blue',
    inactive: 'bg-telemetry-elevated text-telemetry-text-muted border-white/10',
  },
  rose: {
    active: 'bg-telemetry-error/20 text-telemetry-error border-telemetry-error',
    inactive: 'bg-telemetry-elevated text-telemetry-text-muted border-white/10',
  },
  gray: {
    active: 'bg-white/10 text-telemetry-text-primary border-white/20',
    inactive: 'bg-telemetry-elevated text-telemetry-text-muted border-white/10',
  },
} as const;

export function Chip({ label, active, color, onClick }: ChipProps) {
  const colors = COLOR_MAP[color];
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
        active ? colors.active : colors.inactive
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
