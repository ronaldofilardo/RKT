'use client';

import { abbreviatePlayerName } from '@/components/scoring/doubles-name-abbreviation.logic';
import type { ScoringPlayAreaProps } from './scoring-play-area.types';

type MatchPlayer = ScoringPlayAreaProps['match']['player1'];

/** Faixa "Ponto decisivo — No-Ad": seleção do recebedor em duplas. */
export function DecidingPointBanner({ receivingTeam, activeReceiverId, onSelectReceiverOverride }: {
  receivingTeam: Array<MatchPlayer | null | undefined>;
  activeReceiverId?: string | null;
  onSelectReceiverOverride?: (receiverId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-telemetry-elevated/90 border border-telemetry-volt/30 shadow-md flex-shrink-0 animate-in fade-in">
      <div className="flex items-center gap-1.5">
        <span className="text-xs">⚡</span>
        <span className="text-xs font-bold text-telemetry-volt">Ponto decisivo — No-Ad</span>
        <span className="text-[11px] text-telemetry-text-muted hidden sm:inline">Quem recebe agora?</span>
      </div>
      <div className="flex gap-1">
        {receivingTeam.map((member) => {
          if (!member) return null;
          const isSelected = activeReceiverId === member.id;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectReceiverOverride?.(member.id)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                isSelected
                  ? 'bg-telemetry-volt text-black ring-1 ring-white/40'
                  : 'bg-telemetry-card text-telemetry-text-muted hover:text-white'
              }`}
            >
              {abbreviatePlayerName(member.name)} {isSelected ? '✓' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
}
