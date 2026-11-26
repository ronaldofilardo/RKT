'use client';

import { abbreviatePlayerName } from './doubles-name-abbreviation.logic';

interface Player {
  id: string;
  name: string;
}

interface SetupModalDoublesProps {
  player1: Player;
  player2: Player;
  player1Partner?: Player | null;
  player2Partner?: Player | null;
  onSelectServer: (playerId: string) => void;
  loading?: boolean;
}

/** Ramo de duplas do modal "Quem saca primeiro?". */
export function SetupModalDoubles({
  player1,
  player2,
  player1Partner,
  player2Partner,
  onSelectServer,
  loading,
}: SetupModalDoublesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 text-left">
      <div className="p-3 rounded-xl border border-sky-500/20 bg-telemetry-elevated/40 space-y-2">
        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">Dupla 1</span>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSelectServer(player1.id)}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-telemetry-elevated hover:bg-telemetry-active hover:border-telemetry-volt hover:text-telemetry-volt border border-white/10 disabled:opacity-50 text-telemetry-text-primary font-bold rounded-lg text-sm transition-all"
          >
            {abbreviatePlayerName(player1.name)}
          </button>
          <button
            type="button"
            onClick={() => onSelectServer(player1Partner!.id)}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-telemetry-elevated hover:bg-telemetry-active hover:border-telemetry-volt hover:text-telemetry-volt border border-white/10 disabled:opacity-50 text-telemetry-text-primary font-bold rounded-lg text-sm transition-all"
          >
            {abbreviatePlayerName(player1Partner!.name)}
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl border border-emerald-500/20 bg-telemetry-elevated/40 space-y-2">
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Dupla 2</span>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSelectServer(player2.id)}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-telemetry-elevated hover:bg-telemetry-active hover:border-telemetry-volt hover:text-telemetry-volt border border-white/10 disabled:opacity-50 text-telemetry-text-primary font-bold rounded-lg text-sm transition-all"
          >
            {abbreviatePlayerName(player2.name)}
          </button>
          <button
            type="button"
            onClick={() => onSelectServer(player2Partner!.id)}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-telemetry-elevated hover:bg-telemetry-active hover:border-telemetry-volt hover:text-telemetry-volt border border-white/10 disabled:opacity-50 text-telemetry-text-primary font-bold rounded-lg text-sm transition-all"
          >
            {abbreviatePlayerName(player2Partner!.name)}
          </button>
        </div>
      </div>
    </div>
  );
}
