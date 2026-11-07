'use client';

import type { DoublesInfo } from './edit-score-server-doubles';
import { EditScoreServerSingles } from './edit-score-server-singles';
import { EditScoreServerDoubles } from './edit-score-server-doubles';

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
      <EditScoreServerSingles
        currentServer={currentServer}
        selectedServer={selectedServer}
        onSelectServer={onSelectServer}
        playerNames={playerNames}
      />
    );
  }

  return (
    <EditScoreServerDoubles
      selectedServer={selectedServer}
      selectedServerId={selectedServerId}
      onSelectServer={onSelectServer}
      playerNames={playerNames}
      doubles={doubles!}
    />
  );
}