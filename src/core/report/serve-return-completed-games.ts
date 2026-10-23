import type { TimelinePoint } from '@/core/scoring/types';

export interface CompletedGame {
  setNumber: number;
  server: 'player1' | 'player2';
  winner: 'PLAYER_1' | 'PLAYER_2';
  isTiebreak: boolean;
  startIdx: number;
  endIdx: number;
}

export function computeCompletedGames(points: TimelinePoint[]): CompletedGame[] {
  const games: CompletedGame[] = [];
  let gameStart = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const next = i < points.length - 1 ? points[i + 1] : null;

    let isGameEnd = false;

    if (next) {
      if (next.setNumber > p.setNumber) {
        isGameEnd = true;
      } else if (!p.isTiebreak && next.isTiebreak) {
        isGameEnd = true;
      } else if (!p.isTiebreak && !next.isTiebreak) {
        const prevGames = p.gamesScore.player1 + p.gamesScore.player2;
        const nextGames = next.gamesScore.player1 + next.gamesScore.player2;
        if (nextGames > prevGames) {
          isGameEnd = true;
        }
      } else if (p.isTiebreak && !next.isTiebreak) {
        isGameEnd = true;
      }
    } else {
      isGameEnd = true;
    }

    if (isGameEnd) {
      games.push({
        setNumber: p.setNumber,
        server: p.server,
        winner: p.winner,
        isTiebreak: p.isTiebreak === true,
        startIdx: gameStart,
        endIdx: i,
      });
      gameStart = i + 1;
    }
  }

  return games;
}
