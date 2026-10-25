import type { TimelinePoint } from '@/core/scoring/types';

export interface CompletedGame {
  setNumber: number;
  server: 'player1' | 'player2';
  winner: 'PLAYER_1' | 'PLAYER_2';
  isTiebreak: boolean;
  startIdx: number;
  endIdx: number;
}

function isPointEndingGame(p: TimelinePoint): boolean {
  if (p.isTiebreak) return true;

  const pd = p.pointDetails as Record<string, any> | undefined;
  const sb = pd?.scoreBefore?.gameScore;
  const sa = pd?.scoreAfter?.gameScore;
  if (sb && sa && (sa.player1 !== sb.player1 || sa.player2 !== sb.player2)) {
    return true;
  }

  const winnerSide = p.winner === 'PLAYER_1' ? 'player1' : 'player2';
  if (p.gameAdvantage === winnerSide) return true;

  const winnerBefore = p.winner === 'PLAYER_1' ? (p.gameScore?.player1 ?? 0) : (p.gameScore?.player2 ?? 0);
  const oppBefore = p.winner === 'PLAYER_1' ? (p.gameScore?.player2 ?? 0) : (p.gameScore?.player1 ?? 0);

  if (winnerBefore >= 40 && oppBefore < 40) return true;
  if (winnerBefore >= 3 && oppBefore <= 2 && winnerBefore < 15) return true;
  if (p.gameIsDeuce && winnerBefore === 3 && oppBefore === 3) return true;
  if (p.isGameBall || p.isSetBall) return true;

  return false;
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
        const prevGames = (p.gamesScore?.player1 ?? 0) + (p.gamesScore?.player2 ?? 0);
        const nextGames = (next.gamesScore?.player1 ?? 0) + (next.gamesScore?.player2 ?? 0);
        if (nextGames > prevGames) {
          isGameEnd = true;
        }
      } else if (p.isTiebreak && !next.isTiebreak) {
        isGameEnd = true;
      }
    } else {
      isGameEnd = isPointEndingGame(p);
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
