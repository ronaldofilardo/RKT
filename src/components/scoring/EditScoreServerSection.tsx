'use client';

import { abbreviatePlayerName } from './doubles-name-abbreviation.logic';

interface DoublesInfo {
  player1PartnerName?: string;
  player2PartnerName?: string;
  player1Id?: string;
  player2Id?: string;
  player1PartnerId?: string;
  player2PartnerId?: string;
}

interface EditScoreServerSectionProps {
  currentServer: 'player1' | 'player2';
  selectedServer: 'player1' | 'player2';
  onSelectServer: (server: 'player1' | 'player2', serverId?: string) => void;
  playerNames: { p1: string; p2: string };
  doubles?: DoublesInfo;
  selectedServerId?: string;
}

export function EditScoreServerSection({
  currentServer,
  selectedServer,
  onSelectServer,
  playerNames,
  doubles,
  selectedServerId,
}: EditScoreServerSectionProps) {
  const isDoubles = Boolean(doubles?.player1PartnerName || doubles?.player2PartnerName);

  if (!isDoubles) {
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

  // Em duplas: 4 atletas divididos por dupla
  const p1Name = abbreviatePlayerName(playerNames.p1);
  const p1PartnerName = doubles?.player1PartnerName ? abbreviatePlayerName(doubles.player1PartnerName) : '';
  const p2Name = abbreviatePlayerName(playerNames.p2);
  const p2PartnerName = doubles?.player2PartnerName ? abbreviatePlayerName(doubles.player2PartnerName) : '';

  const p1Id = doubles?.player1Id || 'p1';
  const p1PartnerId = doubles?.player1PartnerId || 'p1p';
  const p2Id = doubles?.player2Id || 'p2';
  const p2PartnerId = doubles?.player2PartnerId || 'p2p';

  return (
    <div className="p-3 rounded-lg bg-telemetry-card border border-white/10 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-telemetry-text-primary flex items-center gap-1.5">
          <span>🎾</span>
          <span>Sacador do game atual</span>
        </span>
        <span className="text-[10px] text-telemetry-text-muted">
          Selecione quem saca
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Dupla 1 */}
        <div className="p-2 rounded-lg bg-telemetry-elevated/40 border border-sky-500/20 space-y-1.5">
          <span className="text-[10px] font-bold text-sky-400 block uppercase tracking-wider">
            Dupla 1
          </span>
          <button
            type="button"
            onClick={() => onSelectServer('player1', p1Id)}
            className={`w-full py-1.5 px-2 rounded-md text-xs font-semibold text-left transition-all ${
              selectedServer === 'player1' && (!selectedServerId || selectedServerId === p1Id)
                ? 'bg-telemetry-blue text-white ring-2 ring-telemetry-volt'
                : 'bg-telemetry-card text-telemetry-text-muted hover:text-white'
            }`}
          >
            {p1Name}
          </button>
          {p1PartnerName && (
            <button
              type="button"
              onClick={() => onSelectServer('player1', p1PartnerId)}
              className={`w-full py-1.5 px-2 rounded-md text-xs font-semibold text-left transition-all ${
                selectedServer === 'player1' && selectedServerId === p1PartnerId
                  ? 'bg-telemetry-blue text-white ring-2 ring-telemetry-volt'
                  : 'bg-telemetry-card text-telemetry-text-muted hover:text-white'
              }`}
            >
              {p1PartnerName}
            </button>
          )}
        </div>

        {/* Dupla 2 */}
        <div className="p-2 rounded-lg bg-telemetry-elevated/40 border border-emerald-500/20 space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">
            Dupla 2
          </span>
          <button
            type="button"
            onClick={() => onSelectServer('player2', p2Id)}
            className={`w-full py-1.5 px-2 rounded-md text-xs font-semibold text-left transition-all ${
              selectedServer === 'player2' && (!selectedServerId || selectedServerId === p2Id)
                ? 'bg-emerald-600 text-white ring-2 ring-telemetry-volt'
                : 'bg-telemetry-card text-telemetry-text-muted hover:text-white'
            }`}
          >
            {p2Name}
          </button>
          {p2PartnerName && (
            <button
              type="button"
              onClick={() => onSelectServer('player2', p2PartnerId)}
              className={`w-full py-1.5 px-2 rounded-md text-xs font-semibold text-left transition-all ${
                selectedServer === 'player2' && selectedServerId === p2PartnerId
                  ? 'bg-emerald-600 text-white ring-2 ring-telemetry-volt'
                  : 'bg-telemetry-card text-telemetry-text-muted hover:text-white'
              }`}
            >
              {p2PartnerName}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

