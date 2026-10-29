export const PROFILE_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPORTE', label: 'Suporte' },
  { value: 'GESTOR', label: 'Responsável/gestor de clube' },
  { value: 'TREINADOR', label: 'Treinador' },
  { value: 'ATLETA_CLUBE', label: 'Atleta vinculado a clube' },
  { value: 'ATLETA_AVULSO', label: 'Atleta avulso' },
  { value: 'ANNOTATOR', label: 'Anotador' },
];

export function getProfileBadgeClass(profile?: string, role?: string): string {
  const p = (profile || role || '').toUpperCase();
  if (p === 'ADMIN') return 'bg-telemetry-alert/20 text-telemetry-alert border border-telemetry-alert/40';
  if (p.includes('SUPORTE')) return 'bg-telemetry-blue/20 text-telemetry-blue border border-telemetry-blue/40';
  if (p.includes('GESTOR')) return 'bg-telemetry-orange/20 text-telemetry-orange border border-telemetry-orange/40';
  if (p.includes('TREINADOR')) return 'bg-telemetry-volt/20 text-telemetry-volt border border-telemetry-volt/40';
  if (p.includes('ATLETA')) return 'bg-telemetry-elevated text-telemetry-text-primary border border-telemetry-border/40';
  return 'bg-telemetry-card text-telemetry-text-muted border border-telemetry-border/20';
}

export function getInitialRole(profile?: string, role?: string): string {
  const match = PROFILE_OPTIONS.find((opt) => opt.label === profile || opt.value === profile || opt.value === role);
  return match?.value || (role === 'ADMIN' ? 'ADMIN' : 'ANNOTATOR');
}
