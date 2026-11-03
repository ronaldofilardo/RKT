'use client';

import type { CtOption } from '../match-new-ct-logic';

interface MyClubSelectorProps {
  ctId: string;
  setCtId: (v: string) => void;
  availableCts: CtOption[];
  isParticular?: boolean;
}

/**
 * Define qual CT é "o meu clube". Os slots de jogador marcados como "Meu clube"
 * passam a filtrar/atrelar atletas a este CT. Sem CT disponível, não há "meu clube".
 */
export function MyClubSelector({ ctId, setCtId, availableCts, isParticular = false }: MyClubSelectorProps) {
  if (availableCts.length === 0 || isParticular) return null;
  const isSingle = availableCts.length === 1;
  const ownerLabel = isParticular ? 'Meus atletas' : 'Meu clube';
  const otherLabel = 'Outros';
  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4 space-y-2">
      <label htmlFor="my-club-select" className="text-sm font-medium text-telemetry-text-primary">
        {ownerLabel}
      </label>
      <select
        id="my-club-select"
        value={ctId}
        onChange={(e) => setCtId(e.target.value)}
        disabled={isSingle}
        className="w-full px-3 py-2 border border-white/10 rounded-lg bg-telemetry-elevated text-telemetry-text-primary text-sm disabled:opacity-60"
      >
        {availableCts.map((ct) => (
          <option key={ct.id} value={ct.id}>{ct.name}</option>
        ))}
      </select>
      <p className="text-xs text-telemetry-text-muted">
        Marque <span className="text-telemetry-text-primary">“{ownerLabel}”</span> nos jogadores que
        pertencem ao seu CT. <span className="text-telemetry-text-primary">“{otherLabel}”</span> fica
        sem vínculo (adversários).
      </p>
    </section>
  );
}
