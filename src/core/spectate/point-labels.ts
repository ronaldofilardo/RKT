const LABELS: Record<string, string> = {
  ACE: 'ace',
  WINNER: 'winner',
  FORCED_ERROR: 'erro forçado',
  UNFORCED_ERROR: 'erro não forçado',
  DOUBLE_FAULT: 'dupla falta',
  FAULT_FIRST: 'falta no 1º saque',
  FAULT_SECOND: 'falta no 2º saque',
};

export function describeSpectatorPoint(type: string): string {
  return LABELS[type] ?? type.toLowerCase().replace(/_/g, ' ');
}
