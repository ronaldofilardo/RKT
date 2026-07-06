'use client';

interface SetScore {
  player1: number;
  player2: number;
  isTiebreak: boolean;
  tiebreakScore: { player1: number; player2: number } | null;
}

interface GameScore {
  player1: number;
  player2: number;
  isDeuce: boolean;
  advantage: 'player1' | 'player2' | null;
}

interface ScoreState {
  sets: SetScore[];
  currentGame: GameScore;
}

interface VSIndicatorProps {
  scoreState: ScoreState | null;
}

export function VSIndicator({ scoreState }: VSIndicatorProps) {
  if (!scoreState) return <div className="text-gray-400 dark:text-gray-500 font-bold text-sm sm:text-lg leading-none text-center">VS</div>;

  const set = scoreState.sets[scoreState.sets.length - 1];
  const game = scoreState.currentGame;

  if (set?.isTiebreak && set.tiebreakScore) {
    const total = set.tiebreakScore.player1 + set.tiebreakScore.player2;
    const nextChange = total <= 6 ? 6 - total : (8 - (total % 2 === 0 ? 2 : 1));
    return (
      <div className="flex flex-col items-center">
        <span className="text-base sm:text-lg leading-none">🎾</span>
        <span className="font-bold text-[10px] sm:text-sm text-amber-600 dark:text-amber-500 leading-tight text-center">TIE-<br className="sm:hidden"/>BREAK</span>
        {nextChange <= 2 && nextChange > 0 && (
          <span className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 leading-tight text-center">Troca {nextChange}pt</span>
        )}
      </div>
    );
  }

  if (game.isDeuce) {
    return <span className="text-xl sm:text-2xl leading-none text-center block">⚡</span>;
  }

  return <div className="text-gray-400 dark:text-gray-500 font-bold text-sm sm:text-lg leading-none text-center">VS</div>;
}
