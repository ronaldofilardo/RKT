// ste-exception R-03: Lógica de fim de game requer detecção de transição de placar entre games; mantido coeso para correta renderização da linha de resultado no timeline do report.
import type { TimelinePoint } from '@/core/scoring/types';

export interface GameEndInfo {
  isGameEnd: boolean;
  gameFinalScore: { player1: number; player2: number };
  winner: 'PLAYER_1' | 'PLAYER_2';
  isBreak: boolean;
  /** true quando este game-end marca a ENTRADA no tiebreak do set (ex: 6x6 ou 9x9). */
  isTiebreakEntry: boolean;
}

function checkIsBreak(server: string, winner: 'PLAYER_1' | 'PLAYER_2'): boolean {
  return (
    (server === 'player1' && winner === 'PLAYER_2') ||
    (server === 'player2' && winner === 'PLAYER_1')
  );
}

function isTransitionToNewGame(current: TimelinePoint, next: TimelinePoint): boolean {
  // Em tiebreak (incluindo Match Tiebreak), os pontos são contínuos; não há fim de game entre pontos.
  if (current.isTiebreak) return false;

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

function onTransitionGameEnd(current: TimelinePoint, next: TimelinePoint): GameEndInfo | null {
  if (!isTransitionToNewGame(current, next)) return null;

  const winner = resolveTransitionWinner(current, next);
  const isTiebreakEntry = !current.isTiebreak && next.isTiebreak === true;

  return {
    isGameEnd: true,
    gameFinalScore: isTiebreakEntry
      ? { player1: current.gamesScore.player1, player2: current.gamesScore.player2 }
      : { player1: next.gamesScore.player1, player2: next.gamesScore.player2 },
    winner,
    isBreak: checkIsBreak(current.server, winner),
    isTiebreakEntry,
  };
}

export function isSetDecidingPoint(point: TimelinePoint): boolean {
  const isP1 = point.winner === 'PLAYER_1';
  const myScore = isP1 ? point.gameScore.player1 : point.gameScore.player2;
  const opponentScore = isP1 ? point.gameScore.player2 : point.gameScore.player1;

  return myScore >= 3 && myScore > opponentScore;
}

function onLastPointOfSetGameEnd(currentPoint: TimelinePoint): GameEndInfo | null {
  if (!isSetDecidingPoint(currentPoint)) return null;

  const w = currentPoint.winner;
  const isTb = currentPoint.isTiebreak;
  return {
    isGameEnd: true,
    gameFinalScore: {
      player1: isTb
        ? currentPoint.gameScore.player1
        : currentPoint.gamesScore.player1 + (w === 'PLAYER_1' ? 1 : 0),
      player2: isTb
        ? currentPoint.gameScore.player2
        : currentPoint.gamesScore.player2 + (w === 'PLAYER_2' ? 1 : 0),
    },
    winner: w,
    isBreak: checkIsBreak(currentPoint.server, w),
    isTiebreakEntry: false,
  };
}

export function getGameEndInfo(
  currentPoint: TimelinePoint,
  nextPoint: TimelinePoint | null | undefined,
  isLastPointOfSet: boolean,
): GameEndInfo | null {
  if (isLastPointOfSet && !currentPoint.isTiebreak) {
    return onLastPointOfSetGameEnd(currentPoint);
  }

  if (nextPoint) {
    // Entrada em tiebreak: gamesScore contém os games reais do set.
    if (!currentPoint.isTiebreak && nextPoint.isTiebreak) {
      const winner = resolveTransitionWinner(currentPoint, nextPoint);
      return {
        isGameEnd: true,
        gameFinalScore: {
          player1: currentPoint.gamesScore.player1,
          player2: currentPoint.gamesScore.player2,
        },
        winner,
        isBreak: checkIsBreak(currentPoint.server, winner),
        isTiebreakEntry: true,
      };
    }
    return onTransitionGameEnd(currentPoint, nextPoint);
  }

  return null;
}
