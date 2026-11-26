import { ServerSelectionModal } from '@/app/match/new/components/ServerSelectionModal';
import { DoublesServerSelectionModal } from '@/app/match/new/components/DoublesServerSelectionModal';
import type { DashboardMatchPayload } from '@/components/dashboard/MatchCard';
import type { DoublesSetup } from '@/schemas/contracts';

interface ServerSelectionBlockProps {
  serverMatch: DashboardMatchPayload | null;
  startingMatch: boolean;
  onSelectServer: (serverId: string, doublesSetup?: DoublesSetup) => Promise<void>;
  onCloseServer: () => void;
}

/** Seleção de sacador (duplas ou simples) exibida no dashboard. */
export function ServerSelectionBlock({
  serverMatch,
  startingMatch,
  onSelectServer,
  onCloseServer,
}: ServerSelectionBlockProps) {
  if (!serverMatch) return null;

  if (serverMatch.matchType === 'DOUBLES') {
    return (
      <DoublesServerSelectionModal
        isOpen={true}
        selectedP1={serverMatch.player1}
        selectedP1Partner={serverMatch.player1Partner ?? null}
        selectedP2={serverMatch.player2}
        selectedP2Partner={serverMatch.player2Partner ?? null}
        startingMatch={startingMatch}
        onConfirmDoublesSetup={(initialServerId, setup) => onSelectServer(initialServerId, setup)}
        onClose={onCloseServer}
      />
    );
  }

  return (
    <ServerSelectionModal
      isOpen={true}
      selectedP1={serverMatch.player1}
      selectedP2={serverMatch.player2}
      startingMatch={startingMatch}
      onSelectServer={(serverId) => onSelectServer(serverId)}
      onClose={onCloseServer}
    />
  );
}
