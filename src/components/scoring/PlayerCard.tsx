'use client';

import { formatPlayerScore } from './PlayerCard.helpers';
import { PlayerCardView } from './PlayerCard.view';

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
  const score = formatPlayerScore(scoreState, side);
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

  return <PlayerCardView player={player} side={side} score={score} progress={progress} setsWon={setsWon} isServing={isServing} isWinner={isWinner} disabled={disabled} onClick={handleClick} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />;
}
