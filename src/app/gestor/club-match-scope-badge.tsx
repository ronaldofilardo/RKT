'use client';

export function ClubMatchScopeBadge({ scope }: { scope?: string | null }) {
  if (scope === 'PUBLIC') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-telemetry-blue/15 text-telemetry-blue-light border border-telemetry-blue/30 whitespace-nowrap">
        Pública
      </span>
    );
  }
  if (scope === 'PRIVATE_CLUB') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-telemetry-volt/15 text-telemetry-volt border border-telemetry-volt/30 whitespace-nowrap">
        Clube
      </span>
    );
  }
  if (scope === 'PRIVATE_PLAYERS' || scope === 'PRIVATE_COACH') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
        Entre envolvidos
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/5 text-telemetry-text-muted border border-white/10 whitespace-nowrap">
      Privada
    </span>
  );
}
