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
  if (!scoreState) return <div className="text-gray-400 font-bold text-lg">VS</div>;

  const set = scoreState.sets[scoreState.sets.length - 1];
  const game = scoreState.currentGame;

  if (set?.isTiebreak && set.tiebreakScore) {
    const total = set.tiebreakScore.player1 + set.tiebreakScore.player2;
    const nextChange = total <= 6 ? 6 - total : (8 - (total % 2 === 0 ? 2 : 1));
    return (
      <div className="flex flex-col items-center">
        <span className="text-lg">🎾</span>
        <span className="font-bold text-sm text-amber-600">TIE-BREAK</span>
        {nextChange <= 2 && nextChange > 0 && (
          <span className="text-[10px] text-gray-500">Troca em {nextChange}pt</span>
        )}
      </div>
    );
  }

  if (game.isDeuce) {
    return <span className="text-2xl">⚡</span>;
  }

  if (set && Math.max(set.player1, set.player2) >= 5) {
    return <div className="text-gray-400 font-bold text-lg">VS</div>;
  }

  return <div className="text-gray-400 font-bold text-lg">VS</div>;
}
