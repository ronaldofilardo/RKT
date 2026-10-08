'use client';

import { GAME_POINTS } from '@/core/scoring/point-utils';

interface Player {
  id: string;
  name: string;
}

interface GameScore {
  player1: number;
  player2: number;
  isDeuce: boolean;
  advantage: 'player1' | 'player2' | null;
}

interface SetScore {
  player1: number;
  player2: number;
  isTiebreak: boolean;
  tiebreakScore: { player1: number; player2: number } | null;
}

interface ScoreState {
  sets: SetScore[];
  currentGame: GameScore;
  server: 'player1' | 'player2';
  isFinished: boolean;
  winner: 'player1' | 'player2' | null;
  setsWon: { player1: number; player2: number };
}

interface PlayerCardProps {
  player: Player;
  side: 'player1' | 'player2';
  scoreState: ScoreState | null;
  isServing: boolean;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  isWinner: boolean;
  onPoint: () => void;
  onSwipeDown: () => void;
  disabled?: boolean;
}

function formatScore(state: ScoreState | null, side: 'player1' | 'player2'): string {
  if (!state) return '0';
  const game = state.currentGame;
  const set = state.sets[state.sets.length - 1];

  if (set?.isTiebreak && set.tiebreakScore) {
    return String(side === 'player1' ? set.tiebreakScore.player1 : set.tiebreakScore.player2);
  }

  if (game.isDeuce) {
    if (game.advantage === side) return 'ADV';
    if (game.advantage !== null) return '40';
    return '40';
  }

  return GAME_POINTS[game[side]] ?? '0';
}

function getGameProgress(state: ScoreState | null, side: 'player1' | 'player2'): number {
  if (!state) return 0;
  const game = state.currentGame;
  const set = state.sets[state.sets.length - 1];

  if (set?.isTiebreak && set.tiebreakScore) {
    const pts = side === 'player1' ? set.tiebreakScore.player1 : set.tiebreakScore.player2;
    return Math.min(pts / 7, 1);
  }

  if (game.isDeuce) {
    if (game.advantage === side) return 1;
    return 0.75;
  }

  return Math.min(game[side] / 4, 1);
}

export function PlayerCard({ player, side, scoreState, isServing, isWinner, onPoint, onSwipeDown, disabled }: PlayerCardProps) {
  const score = formatScore(scoreState, side);
  const progress = getGameProgress(scoreState, side);
  const setsWon = scoreState?.setsWon[side] ?? 0;
  const touchStartY = { current: 0 };
  const touchHandledRef = { current: false };
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchHandledRef.current = false;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy > 80) {
      onSwipeDown();
      touchHandledRef.current = true;
    } else {
      onPoint();
      touchHandledRef.current = true;
    }
  };
  const handleClick = (_e: React.MouseEvent) => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    onPoint();
  };

  return (
    <button
      className={`relative flex flex-col items-center justify-center p-2 sm:p-4 rounded-2xl border transition-all select-none h-full w-full
        bg-telemetry-card border-white/10
        ${isServing ? 'ring-2 ring-telemetry-volt ring-offset-2 ring-offset-telemetry-base' : ''}
        ${isWinner ? 'bg-telemetry-blue/20 border-telemetry-blue ring-2 ring-telemetry-blue' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98] hover:shadow-md hover:bg-telemetry-elevated hover:border-white/20'}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      aria-label={`+ Ponto ${player.name}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 min-w-0 w-full justify-center">
        <span className="font-bold text-sm sm:text-lg text-telemetry-text-primary truncate max-w-[70%]">{player.name}</span>
        {isServing && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-telemetry-volt animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(204,255,0,0.6)]" aria-label="Sacando" />}
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
