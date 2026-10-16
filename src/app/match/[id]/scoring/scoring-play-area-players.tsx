'use client';

import { PlayerCard } from '@/components/scoring/PlayerCard';
import type { ScoringPlayAreaProps } from './scoring-play-area.types';

type MatchPlayer = ScoringPlayAreaProps['match']['player1'];

interface PlayAreaPlayersProps {
  player1: MatchPlayer;
  player2: MatchPlayer;
  scoreState: ScoringPlayAreaProps['effectiveScoreState'];
  p1IsServing: boolean;
  p2IsServing: boolean;
  isSetPoint: boolean;
  isBreakPoint: boolean;
  winner: string | null;
  isFinished: boolean;
  onPoint: (side: 'player1' | 'player2') => void;
  onSwipeUndo: () => void;
}

export function PlayAreaPlayers({
  player1,
  player2,
  scoreState,
  p1IsServing,
  p2IsServing,
  isSetPoint,
  isBreakPoint,
  winner,
  isFinished,
  onPoint,
  onSwipeUndo,
}: PlayAreaPlayersProps) {
  return (
    <div className="flex items-stretch gap-1 sm:gap-2 flex-1 relative z-10 min-h-[120px] max-h-[180px]">
      <div className="flex-1 min-w-0 flex">
        <PlayerCard
          player={player1}
          side="player1"
          scoreState={scoreState}
          isServing={p1IsServing}
          isSetPoint={isSetPoint}
          isBreakPoint={isBreakPoint}
          isWinner={winner === 'player1'}
          onPoint={() => onPoint('player1')}
          onSwipeDown={onSwipeUndo}
          disabled={isFinished}
        />
      </div>

      <div className="w-px self-stretch bg-white/10 flex-shrink-0" />

      <div className="flex-1 min-w-0 flex">
        <PlayerCard
          player={player2}
          side="player2"
          scoreState={scoreState}
          isServing={p2IsServing}
          isSetPoint={isSetPoint}
          isBreakPoint={isBreakPoint}
          isWinner={winner === 'player2'}
          onPoint={() => onPoint('player2')}
          onSwipeDown={onSwipeUndo}
          disabled={isFinished}
        />
      </div>
    </div>
  );
}
