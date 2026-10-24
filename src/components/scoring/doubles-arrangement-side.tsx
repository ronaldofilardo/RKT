'use client';

import type { PlayerRef } from './doubles-arrangement-modal.types';

type Accent = 'blue' | 'orange';

interface DoublesArrangementSideProps {
  accent: Accent;
  player: PlayerRef;
  partner: PlayerRef;
  server: string;
  setServer: (id: string) => void;
  receiver: string;
  setReceiver: (id: string) => void;
}

const ACCENT: Record<Accent, { heading: string; selected: string }> = {
  blue: {
    heading: 'text-telemetry-blue-light',
    selected:
      'bg-telemetry-blue/20 border-telemetry-blue text-white ring-1 ring-telemetry-blue/50',
  },
  orange: {
    heading: 'text-telemetry-orange-light',
    selected:
      'bg-telemetry-orange/20 border-telemetry-orange text-white ring-1 ring-telemetry-orange/50',
  },
};

export function DoublesArrangementSide({
  accent,
  player,
  partner,
  server,
  setServer,
  receiver,
  setReceiver,
}: DoublesArrangementSideProps) {
  const { heading, selected } = ACCENT[accent];

  const option = (
    id: string,
    label: string,
    current: string,
    onChange: (next: string) => void
  ) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`py-2 px-2.5 text-xs font-semibold rounded-lg border transition-all text-center truncate ${
        current === id
          ? selected
          : 'bg-telemetry-surface border-white/10 text-telemetry-text-muted hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-3.5 bg-telemetry-elevated/40 border border-white/10 rounded-xl space-y-3">
      <h3 className={`text-xs font-bold ${heading} uppercase tracking-wider`}>
        {player.name} / {partner.name}
      </h3>

      <div>
        <h4 className="text-[11px] text-telemetry-text-muted block mb-1.5 font-medium">
          Primeiro a sacar no set:
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {option(player.id, `🎾 ${player.name}`, server, setServer)}
          {option(partner.id, `🎾 ${partner.name}`, server, setServer)}
        </div>
      </div>

      <div>
        <h4 className="text-[11px] text-telemetry-text-muted block mb-1.5 font-medium">
          Recebe na quadra de iguais (lado direito):
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {option(player.id, player.name, receiver, setReceiver)}
          {option(partner.id, partner.name, receiver, setReceiver)}
        </div>
      </div>
    </div>
  );
}
