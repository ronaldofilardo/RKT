'use client';

import type { PlayerCardProps } from './player-card.types';
import { formatScore, getGameProgressRatio } from './player-card.logic';
import { usePlayerCardTouch } from './use-player-card-touch';
import { PlayerCardRow } from './player-card-row';
import { abbreviateDoublesName, abbreviatePlayerName } from './doubles-name-abbreviation.logic';

export function PlayerCard({
  player,
  partner,
  side,
  scoreState,
  isServing,
  activeServerId,
  activeReceiverId,
  isWinner,
  onPoint,
  onSwipeDown,
  disabled,
}: PlayerCardProps) {
  const score = formatScore(scoreState, side);
  const progress = getGameProgressRatio(scoreState, side);
  const setsWon = scoreState?.setsWon[side] ?? 0;
  const { onTouchStartGesture, onTouchEndGesture, onPrimaryClick } = usePlayerCardTouch(onPoint, onSwipeDown);

  const isServerPlayer1 = activeServerId ? activeServerId === player.id : isServing;
  const isServerPlayer2 = partner && activeServerId ? activeServerId === partner.id : false;
  const isReceiverPlayer1 = activeReceiverId === player.id;
  const isReceiverPlayer2 = partner && activeReceiverId === partner.id;

  const partnerName = partner ? abbreviatePlayerName(partner.name) : undefined;

  return (
    <button
      className={`relative flex flex-col items-center justify-center p-2 sm:p-4 rounded-2xl border transition-all select-none h-full w-full
        bg-telemetry-card border-white/10
        ${isServing ? 'ring-2 ring-telemetry-volt ring-offset-2 ring-offset-telemetry-base' : ''}
        ${isWinner ? 'bg-telemetry-blue/20 border-telemetry-blue ring-2 ring-telemetry-blue' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98] hover:shadow-md hover:bg-telemetry-elevated hover:border-white/20'}`}
      onClick={onPrimaryClick}
      onTouchStart={onTouchStartGesture}
      onTouchEnd={onTouchEndGesture}
      disabled={disabled}
      aria-label={`+ Ponto ${abbreviateDoublesName(player.name, partner?.name ?? undefined)}`}
    >
      <div className="flex flex-col items-center gap-0.5 mb-1 min-w-0 w-full justify-center">
        <PlayerCardRow
          name={abbreviatePlayerName(player.name)}
          isServer={Boolean(isServerPlayer1 || isServerPlayer2)}
          isReceiver={Boolean(isReceiverPlayer1 || isReceiverPlayer2)}
          isPartner={Boolean(partner)}
        />
        {partner && (
          <PlayerCardRow
            name={partnerName!}
            isServer={Boolean(isServerPlayer2)}
            isReceiver={Boolean(isReceiverPlayer2)}
            isPartner
          />
        )}
      </div>

      <span className="text-4xl sm:text-5xl font-space-grotesk font-black text-telemetry-text-primary tabular-nums leading-none mb-1">{score}</span>

      <div className="w-full h-1 sm:h-1.5 bg-telemetry-elevated rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all ${isWinner ? 'bg-telemetry-volt' : 'bg-telemetry-blue'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex gap-1 mt-1 empty:hidden">
        {Array.from({ length: setsWon }).map((_, i) => (
          <span key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-telemetry-text-primary" />
        ))}
      </div>

      {!disabled && !isWinner && (
        <span className="text-[9px] sm:text-[10px] text-telemetry-text-muted font-medium [@media(max-height:680px)]:hidden">Toque para marcar ponto</span>
      )}
    </button>
  );
}
