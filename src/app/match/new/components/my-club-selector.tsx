'use client';

import type { CtOption } from '../match-new-ct-logic';

interface MyClubSelectorProps {
  ctId: string;
  setCtId: (v: string) => void;
  availableCts: CtOption[];
}

/**
 * Define qual CT é "o meu clube". Os slots de jogador marcados como "Meu clube"
 * passam a filtrar/atrelar atletas a este CT. Sem CT disponível, não há "meu clube".
 */
export function MyClubSelector({ ctId, setCtId, availableCts }: MyClubSelectorProps) {
  if (availableCts.length === 0) return null;
  const isSingle = availableCts.length === 1;
  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4 space-y-2">
      <label htmlFor="my-club-select" className="text-sm font-medium text-telemetry-text-primary">
        Meu clube
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
        Marque <span className="text-telemetry-text-primary">“Meu clube”</span> nos jogadores que
        pertencem ao seu CT. <span className="text-telemetry-text-primary">“Outro clube”</span> fica
        sem vínculo (adversários).
      </p>
    </section>
  );
}
