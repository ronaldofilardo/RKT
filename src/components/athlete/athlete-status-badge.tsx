import type { AthleteStatus } from './athlete-table.types';

const STATUS_STYLE: Record<AthleteStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Ativo', className: 'bg-telemetry-volt/20 text-telemetry-volt' },
  PASSWORD_PENDING: { label: 'Senha pendente', className: 'bg-telemetry-alert/20 text-telemetry-alert' },
  NO_ACCOUNT: { label: 'Sem conta', className: 'bg-telemetry-text-muted/20 text-telemetry-text-muted' },
};

export function AthleteStatusBadge({ status }: { status: AthleteStatus }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.NO_ACCOUNT;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}
