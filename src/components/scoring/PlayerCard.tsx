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
  onChangeServer,
  canChangeServer = true,
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
    <div
      data-testid="player-card"
      className={`relative flex flex-col items-center justify-center p-2 sm:p-4 rounded-2xl border transition-all select-none touch-manipulation h-full w-full
        bg-telemetry-card border-telemetry-border/30 dark:border-white/10 shadow-sm
        ${isServing ? 'ring-[3px] ring-telemetry-volt ring-offset-2 ring-offset-telemetry-base shadow-[0_0_12px_rgba(var(--telemetry-volt)/0.35)]' : ''}
        ${isWinner ? 'bg-telemetry-blue/20 border-telemetry-blue ring-2 ring-telemetry-blue' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98] hover:shadow-md hover:bg-telemetry-elevated hover:border-white/20'}`}
      onTouchStart={disabled ? undefined : onTouchStartGesture}
      onTouchEnd={disabled ? undefined : onTouchEndGesture}
    >
      {/* Camada de clique do card. É IRMÃ do chip de saque (e não pai) porque
          controles interativos aninhados falham em `nested-interactive` (axe)
          e confundem leitores de tela. */}
      <button
        type="button"
        className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-telemetry-volt"
        onClick={onPrimaryClick}
        disabled={disabled}
        aria-label={`+ Ponto ${abbreviateDoublesName(player.name, partner?.name ?? undefined)}`}
      />

      <div className="relative z-10 flex flex-col items-center gap-0.5 mb-1 min-w-0 w-full justify-center pointer-events-none">
        <PlayerCardRow
          name={abbreviatePlayerName(player.name)}
          isServer={Boolean(isServerPlayer1 || isServerPlayer2)}
          isReceiver={Boolean(isReceiverPlayer1 || isReceiverPlayer2)}
          isPartner={Boolean(partner)}
          onChangeServer={onChangeServer}
          canChangeServer={canChangeServer}
        />
        {partner && (
          <PlayerCardRow
            name={partnerName!}
            isServer={Boolean(isServerPlayer2)}
            isReceiver={Boolean(isReceiverPlayer2)}
            isPartner
            onChangeServer={onChangeServer}
            canChangeServer={canChangeServer}
          />
        )}
      </div>

      <span className="relative z-10 pointer-events-none text-4xl sm:text-5xl font-space-grotesk font-black text-telemetry-text-primary tabular-nums leading-none mb-1 tracking-tight drop-shadow-sm select-none">{score}</span>

      <div className="relative z-10 pointer-events-none w-full h-1 sm:h-1.5 bg-telemetry-elevated rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all ${isWinner ? 'bg-telemetry-volt' : 'bg-telemetry-blue'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="relative z-10 pointer-events-none flex gap-1 mt-1 empty:hidden">
        {Array.from({ length: setsWon }).map((_, i) => (
          <span key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-telemetry-text-primary" />
        ))}
      </div>

      {!disabled && !isWinner && (
        <span className="relative z-10 pointer-events-none text-[9px] sm:text-[10px] text-telemetry-text-muted font-medium [@media(max-height:680px)]:hidden">Toque para marcar ponto</span>
      )}
    </div>
  );
}
