'use client';

import { abbreviatePlayerName } from './doubles-name-abbreviation.logic';

interface EditScoreServerSinglesProps {
  currentServer: 'player1' | 'player2';
  selectedServer: 'player1' | 'player2';
  onSelectServer: (server: 'player1' | 'player2') => void;
  playerNames: { p1: string; p2: string };
}

export function EditScoreServerSingles({
  currentServer,
  selectedServer,
  onSelectServer,
  playerNames,
}: EditScoreServerSinglesProps) {
  return (
    <div className="p-3 rounded-lg bg-telemetry-card border border-white/10 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-telemetry-text-primary flex items-center gap-1.5">
          <span>🎾</span>
          <span>Sacador do game atual</span>
        </span>
        <span className="text-[10px] text-telemetry-text-muted">
          Original: {currentServer === 'player1' ? playerNames.p1 : playerNames.p2}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelectServer('player1')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
            selectedServer === 'player1'
              ? 'bg-telemetry-volt text-black font-black shadow-sm'
              : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
          }`}
        >
          {abbreviatePlayerName(playerNames.p1)}
        </button>
        <button
          type="button"
          onClick={() => onSelectServer('player2')}
          className={`py-2 px-3 rounded-lg text-xs font-semibold text-center transition-all ${
            selectedServer === 'player2'
              ? 'bg-telemetry-volt text-black font-black shadow-sm'
              : 'bg-telemetry-elevated text-telemetry-text-muted hover:text-white'
          }`}
        >
          {abbreviatePlayerName(playerNames.p2)}
        </button>
      </div>
    </div>
  );
}