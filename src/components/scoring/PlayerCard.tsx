'use client';

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

const GAME_POINTS = ['0', '15', '30', '40'];

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

function getGameLabel(state: ScoreState | null, side: 'player1' | 'player2'): string {
  if (!state) return '';
  const set = state.sets[state.sets.length - 1];
  if (!set) return '0';
  return side === 'player1' ? String(set.player1) : String(set.player2);
}

export function PlayerCard({ player, side, scoreState, isServing, isSetPoint, isBreakPoint, isWinner, onPoint, onSwipeDown, disabled }: PlayerCardProps) {
  const score = formatScore(scoreState, side);
  const progress = getGameProgress(scoreState, side);
  const gameLabel = getGameLabel(scoreState, side);
  const setsWon = scoreState?.setsWon[side] ?? 0;

  let specialBadge: string | null = null;
  if (isSetPoint) specialBadge = '🎯 Set Point';
  else if (isBreakPoint) specialBadge = '⚡ Break Point';

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
  const handleClick = (e: React.MouseEvent) => {
    if (touchHandledRef.current) {
      touchHandledRef.current = false;
      return;
    }
    onPoint();
  };

  return (
    <button
      className={`relative flex flex-col items-center p-3 sm:p-4 rounded-2xl border-2 transition-all select-none min-h-[140px] sm:min-h-[160px] w-full
        ${side === 'player1' ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/30 dark:border-sky-700' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'}
        ${isServing ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-slate-900' : ''}
        ${isWinner ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-600' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98] hover:shadow-md'}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      aria-label={`+ Ponto ${player.name}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 min-w-0 w-full justify-center">
        <span className="font-bold text-sm sm:text-lg text-gray-900 dark:text-gray-100 truncate max-w-[70%]">{player.name}</span>
        {isServing && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" aria-label="Sacando" />}
      </div>

      <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-gray-100 tabular-nums leading-none mb-1">{score}</span>

      <div className="w-full h-1 sm:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all ${isWinner ? 'bg-yellow-500' : side === 'player1' ? 'bg-sky-500' : 'bg-emerald-500'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex gap-1 mb-1">
        {Array.from({ length: setsWon }).map((_, i) => (
          <span key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-900" />
        ))}
      </div>

      {!disabled && !isWinner && (
        <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Toque para marcar ponto</span>
      )}
    </button>
  );
}
