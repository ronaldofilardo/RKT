import type { TimelinePoint } from '@/core/scoring/types';

interface GameEndInfo {
  isGameEnd: boolean;
  gameFinalScore: { player1: number; player2: number };
  winner: 'PLAYER_1' | 'PLAYER_2';
  isBreak: boolean;
}

function checkIsBreak(server: string, winner: 'PLAYER_1' | 'PLAYER_2'): boolean {
  return (
    (server === 'player1' && winner === 'PLAYER_2') ||
    (server === 'player2' && winner === 'PLAYER_1')
  );
}

function isTransitionToNewGame(current: TimelinePoint, next: TimelinePoint): boolean {
  if (next.gamesScore.player1 !== current.gamesScore.player1) return true;
  if (next.gamesScore.player2 !== current.gamesScore.player2) return true;
  return (
    next.gameScore.player1 === 0 &&
    next.gameScore.player2 === 0 &&
    (current.gameScore.player1 > 0 || current.gameScore.player2 > 0)
  );
}

function resolveTransitionWinner(current: TimelinePoint, next: TimelinePoint): 'PLAYER_1' | 'PLAYER_2' {
  if (next.gamesScore.player1 > current.gamesScore.player1) return 'PLAYER_1';
  if (next.gamesScore.player2 > current.gamesScore.player2) return 'PLAYER_2';
  return current.winner;
}

function handleTransitionGameEnd(current: TimelinePoint, next: TimelinePoint): GameEndInfo | null {
  if (!isTransitionToNewGame(current, next)) return null;

  const winner = resolveTransitionWinner(current, next);
  return {
    isGameEnd: true,
    gameFinalScore: {
      player1: next.gamesScore.player1,
      player2: next.gamesScore.player2,
    },
    winner,
    isBreak: checkIsBreak(current.server, winner),
  };
}

function isSetDecidingPoint(point: TimelinePoint): boolean {
  if (point.isTiebreak) return true;
  const isP1 = point.winner === 'PLAYER_1';
  const myScore = isP1 ? point.gameScore.player1 : point.gameScore.player2;
  const opponentScore = isP1 ? point.gameScore.player2 : point.gameScore.player1;
  const targetAdvantage = isP1 ? 'player1' : 'player2';

  return (
    (myScore >= 3 && myScore > opponentScore) ||
    point.gameAdvantage === targetAdvantage ||
    point.isGameBall ||
    point.isSetBall
  );
}

function handleLastPointOfSetGameEnd(currentPoint: TimelinePoint): GameEndInfo | null {
  if (!isSetDecidingPoint(currentPoint)) return null;

  const w = currentPoint.winner;
  return {
    isGameEnd: true,
    gameFinalScore: {
      player1: currentPoint.gamesScore.player1 + (w === 'PLAYER_1' ? 1 : 0),
      player2: currentPoint.gamesScore.player2 + (w === 'PLAYER_2' ? 1 : 0),
    },
    winner: w,
    isBreak: checkIsBreak(currentPoint.server, w),
  };
}

export function getGameEndInfo(
  currentPoint: TimelinePoint,
  nextPoint: TimelinePoint | null | undefined,
  isLastPointOfSet: boolean,
): GameEndInfo | null {
  if (nextPoint) {
    return handleTransitionGameEnd(currentPoint, nextPoint);
  }

  if (isLastPointOfSet) {
    return handleLastPointOfSetGameEnd(currentPoint);
  }

  return null;
}
