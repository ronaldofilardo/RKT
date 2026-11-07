export function badgeClass(tag: string): string {
  if (tag === 'ACE') return 'bg-telemetry-volt/20 text-telemetry-volt border-telemetry-volt/30';
  if (tag === 'W') return 'bg-telemetry-volt/10 text-telemetry-volt border-telemetry-volt/20';
  if (tag === 'DF') return 'bg-telemetry-error/15 text-telemetry-error border-telemetry-error/25';
  if (tag === 'EF') return 'bg-telemetry-orange/15 text-telemetry-orange border-telemetry-orange/25';
  return 'bg-telemetry-elevated text-telemetry-text-muted border-telemetry-border/10';
}