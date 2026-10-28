'use client';

import type { CtOption } from '../match-new-ct-logic';

interface MyClubToggleProps {
  myClub: boolean;
  setMyClub: (v: boolean) => void;
  ctId: string;
  setCtId: (v: string) => void;
  availableCts: CtOption[];
}

export function MyClubToggle({
  myClub, setMyClub, ctId, setCtId, availableCts,
}: MyClubToggleProps) {
  const isSingleCt = availableCts.length === 1;
  const ctDisabled = !myClub || isSingleCt;
  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <input
          id="my-club-toggle"
          type="checkbox"
          checked={myClub}
          onChange={() => setMyClub(!myClub)}
          className="w-5 h-5 rounded border-white/30 bg-telemetry-elevated text-telemetry-volt focus:ring-telemetry-volt"
        />
        <label htmlFor="my-club-toggle" className="text-sm font-medium text-telemetry-text-primary cursor-pointer select-none">
          Meu clube
        </label>
        {availableCts.length === 0 && (
          <span className="text-xs text-telemetry-text-muted">Sem CT vinculado à sua conta</span>
        )}
      </div>
      {myClub && availableCts.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-telemetry-text-muted w-16">CT:</span>
          <select
            value={ctId}
            onChange={(e) => setCtId(e.target.value)}
            disabled={ctDisabled}
            className="flex-1 px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary"
          >
            <option value="">Selecionar CT</option>
            {availableCts.map((ct) => (
              <option key={ct.id} value={ct.id}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}
