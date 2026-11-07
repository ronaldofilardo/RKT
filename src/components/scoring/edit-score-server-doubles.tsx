'use client';

import { abbreviatePlayerName } from './doubles-name-abbreviation.logic';
import { EditScoreServerPair } from './edit-score-server-pair';

export interface DoublesInfo {
  player1PartnerName?: string;
  player2PartnerName?: string;
  player1Id?: string;
  player2Id?: string;
  player1PartnerId?: string;
  player2PartnerId?: string;
}

interface EditScoreServerDoublesProps {
  selectedServer: 'player1' | 'player2';
  selectedServerId?: string;
  onSelectServer: (server: 'player1' | 'player2', serverId?: string) => void;
  playerNames: { p1: string; p2: string };
  doubles: DoublesInfo;
}

export function EditScoreServerDoubles({
  selectedServer,
  selectedServerId,
  onSelectServer,
  playerNames,
  doubles,
}: EditScoreServerDoublesProps) {
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
          <EditScoreServerPair
            name={p1Name}
            isActive={selectedServer === 'player1' && (!selectedServerId || selectedServerId === p1Id)}
            onSelect={() => onSelectServer('player1', p1Id)}
            accentColor="sky"
          />
          {p1PartnerName && (
            <EditScoreServerPair
              name={p1PartnerName}
              isActive={selectedServer === 'player1' && selectedServerId === p1PartnerId}
              onSelect={() => onSelectServer('player1', p1PartnerId)}
              accentColor="sky"
            />
          )}
        </div>

        {/* Dupla 2 */}
        <div className="p-2 rounded-lg bg-telemetry-elevated/40 border border-emerald-500/20 space-y-1.5">
          <span className="text-[10px] font-bold text-emerald-400 block uppercase tracking-wider">
            Dupla 2
          </span>
          <EditScoreServerPair
            name={p2Name}
            isActive={selectedServer === 'player2' && (!selectedServerId || selectedServerId === p2Id)}
            onSelect={() => onSelectServer('player2', p2Id)}
            accentColor="emerald"
          />
          {p2PartnerName && (
            <EditScoreServerPair
              name={p2PartnerName}
              isActive={selectedServer === 'player2' && selectedServerId === p2PartnerId}
              onSelect={() => onSelectServer('player2', p2PartnerId)}
              accentColor="emerald"
            />
          )}
        </div>
      </div>
    </div>
  );
}