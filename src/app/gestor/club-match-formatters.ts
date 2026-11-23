export function getStateBadge(state: string): string {
  if (state === 'FINISHED') return 'bg-telemetry-volt/20 text-telemetry-volt';
  if (state === 'IN_PROGRESS') return 'bg-telemetry-alert/20 text-telemetry-alert animate-pulse';
  return 'bg-telemetry-elevated/40 text-telemetry-text-muted';
}

export function getStateLabel(state: string): string {
  if (state === 'FINISHED') return 'Finalizada';
  if (state === 'IN_PROGRESS') return 'Em andamento';
  if (state === 'SCHEDULED') return 'Agendada';
  return state;
}

export function opensLiveView(state: string): boolean {
  return state === 'IN_PROGRESS' || state === 'SCHEDULED';
}