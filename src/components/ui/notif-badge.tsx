export interface NotifBadgeProps {
  count: number;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function NotifBadge({ count, variant = 'primary', className = '' }: NotifBadgeProps) {
  if (count <= 0) return null;

  const display = count >= 100 ? '99+' : String(count);
  const color = variant === 'secondary'
    ? 'bg-telemetry-elevated text-telemetry-text-primary border border-white/20'
    : 'bg-telemetry-blue text-white shadow-sm';

  return (
    <span
      data-testid="notif-badge"
      className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center text-[10px] font-bold rounded-full select-none z-10 ${color} ${className}`}
    >
      {display}
    </span>
  );
}

