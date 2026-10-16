'use client';

import type { PlayerCardProps } from './player-card.types';
import { formatScore, getGameProgressRatio } from './player-card.logic';
import { usePlayerCardTouch } from './use-player-card-touch';

export function PlayerCard({ player, side, scoreState, isServing, isWinner, onPoint, onSwipeDown, disabled }: PlayerCardProps) {
  const score = formatScore(scoreState, side);
  const progress = getGameProgressRatio(scoreState, side);
  const setsWon = scoreState?.setsWon[side] ?? 0;
  const { onTouchStartGesture, onTouchEndGesture, onPrimaryClick } = usePlayerCardTouch(onPoint, onSwipeDown);

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
      aria-label={`+ Ponto ${player.name}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 min-w-0 w-full justify-center">
        <span className="font-bold text-sm sm:text-lg text-telemetry-text-primary truncate max-w-[70%]">{player.name}</span>
        {isServing && (
          <span className="inline-flex items-center gap-1 flex-shrink-0" aria-label="Sacando">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-telemetry-volt animate-pulse shadow-[0_0_8px_rgba(204,255,0,0.6)]" />
            <span role="img" aria-label="Sacador" className="text-xs sm:text-sm select-none leading-none">🎾</span>
          </span>
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
