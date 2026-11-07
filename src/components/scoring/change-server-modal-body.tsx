import type { MatchData } from '@/hooks/useScoringHandlers.types';
import { PairButton } from './change-server-modal-pair';

interface ChangeServerModalBodyProps {
  isDoubles: boolean;
  match: MatchData;
  activeServerId?: string | null;
  isSubmitting: boolean;
  onSelectServer: (serverId: string) => void;
}

export function ChangeServerModalBody({ isDoubles, match, activeServerId, isSubmitting, onSelectServer }: ChangeServerModalBodyProps) {
  if (!isDoubles) return null;

  const player1 = match.player1;
  const player2 = match.player2;
  const player1Partner = match.player1Partner;
  const player2Partner = match.player2Partner;

  return (
    <div className="grid grid-cols-2 gap-3 pt-1">
      {/* Dupla 1 */}
      <div className="p-3 bg-telemetry-elevated/40 rounded-xl border border-sky-500/20 space-y-2">
        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
          Dupla 1
        </span>
        <div className="flex flex-col gap-1.5">
          <PairButton
            player={player1}
            isActive={activeServerId === player1.id}
            isSubmitting={isSubmitting}
            onSelect={() => onSelectServer(player1.id)}
            accentColor="sky"
          />
          <PairButton
            player={player1Partner ?? undefined}
            isActive={activeServerId === player1Partner?.id}
            isSubmitting={isSubmitting}
            onSelect={() => onSelectServer(player1Partner!.id)}
            accentColor="sky"
          />
        </div>
      </div>

      {/* Dupla 2 */}
      <div className="p-3 bg-telemetry-elevated/40 rounded-xl border border-emerald-500/20 space-y-2">
        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
          Dupla 2
        </span>
        <div className="flex flex-col gap-1.5">
          <PairButton
            player={player2}
            isActive={activeServerId === player2.id}
            isSubmitting={isSubmitting}
            onSelect={() => onSelectServer(player2.id)}
            accentColor="emerald"
          />
          <PairButton
            player={player2Partner ?? undefined}
            isActive={activeServerId === player2Partner?.id}
            isSubmitting={isSubmitting}
            onSelect={() => onSelectServer(player2Partner!.id)}
            accentColor="emerald"
          />
        </div>
      </div>
    </div>
  );
}