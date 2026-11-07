import type { MatchData } from '@/hooks/useScoringHandlers.types';

type Player = MatchData['player1'];
import { abbreviatePlayerName } from './doubles-name-abbreviation.logic';

interface PairButtonProps {
  player: Player | undefined;
  isActive: boolean;
  isSubmitting: boolean;
  onSelect: () => void;
  accentColor: 'sky' | 'emerald';
}

export function PairButton({ player, isActive, isSubmitting, onSelect, accentColor }: PairButtonProps) {
  if (!player) return null;

  const activeClass = `bg-${accentColor}-600 text-white font-bold ring-2 ring-telemetry-volt`;
  const inactiveClass = 'bg-telemetry-card text-telemetry-text-muted hover:text-white hover:bg-telemetry-elevated';
  const baseClass = 'py-2 px-2.5 text-xs rounded-lg text-left transition-all flex items-center justify-between';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isSubmitting}
      className={`${baseClass} ${isActive ? activeClass : inactiveClass}`}
    >
      <span className="truncate">{abbreviatePlayerName(player.name)}</span>
      {isActive && (
        <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-telemetry-volt text-black font-black uppercase">
          Saca
        </span>
      )}
    </button>
  );
}