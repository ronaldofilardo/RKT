import type { ScoringState, HistoryEntry, TimelinePoint } from './types';

const GAME_POINTS = ['0', '15', '30', '40'];

export function getGameScoreLabel(
  p1: number, p2: number,
  isDeuce?: boolean, advantage?: string | null, isTiebreak?: boolean,
): string {
  if (isTiebreak || p1 >= 4 || p2 >= 4) return `${p1}x${p2}`;
  if (isDeuce) {
    if (advantage === 'player1') return 'ADx40';
    if (advantage === 'player2') return '40xAD';
    return '40x40';
  }
  return `${GAME_POINTS[p1] ?? p1}x${GAME_POINTS[p2] ?? p2}`;
}

export function isBreakPoint(state: ScoringState): boolean {
  if (state.isFinished) return false;
  const set = state.sets[state.sets.length - 1];
  if (!set) return false;
  const server = state.server;
  const receiverGames = server === 'player1' ? set.player2 : set.player1;
  const serverGames = server === 'player1' ? set.player1 : set.player2;
  return receiverGames >= serverGames;
}

export function isGameBall(state: ScoringState): boolean {
  const game = state.currentGame;
  const set = state.sets[state.sets.length - 1];
  if (set?.isTiebreak && set.tiebreakScore) {
    const p1 = set.tiebreakScore.player1;
    const p2 = set.tiebreakScore.player2;
    return (p1 >= 9 && p1 - p2 === 1) || (p2 >= 9 && p2 - p1 === 1);
  }
  if (game.isDeuce) return false;
  return (game.player1 >= 3 && game.player2 <= 2) || (game.player2 >= 3 && game.player1 <= 2);
}

export function isSetBall(state: ScoringState, setNumber: number): boolean {
  const set = state.sets[setNumber - 1];
  if (!set) return false;
  return (set.player1 >= 5 && set.player2 <= 4) || (set.player2 >= 5 && set.player1 <= 4);
}

export function enrichPointsFromHistory(
  history: HistoryEntry[],
  player1Id: string,
  player2Id: string,
): TimelinePoint[] {
  const points: TimelinePoint[] = [];

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const stateBefore = entry.stateBefore;
    const pt = entry.point;

    const winner: 'PLAYER_1' | 'PLAYER_2' =
      pt.winnerId === player1Id ? 'PLAYER_1' : 'PLAYER_2';

    const setNumber = stateBefore.sets.length > 0 ? stateBefore.sets.length : 1;
    const currentSet = stateBefore.sets[stateBefore.sets.length - 1];
    const gamesScore = {
      player1: currentSet?.player1 ?? 0,
      player2: currentSet?.player2 ?? 0,
    };

    const gameScore = {
      player1: stateBefore.currentGame.player1,
      player2: stateBefore.currentGame.player2,
    };

    const bp = isBreakPoint(stateBefore);
    const gb = isGameBall(stateBefore);
    const sb = isSetBall(stateBefore, setNumber);

    const isServeFinish = pt.type === 'ACE' || pt.type === 'DOUBLE_FAULT';
    const rallyLength = pt.rallyLength ?? (isServeFinish ? 1 : 0);
    const isTiebreak = currentSet?.isTiebreak ?? false;

    const firstFault = pt.type === 'DOUBLE_FAULT' && pt.firstFaultDetail
      ? pt.firstFaultDetail
      : undefined;

    points.push({
      pointNumber: i + 1,
      winner,
      type: pt.type,
      server: stateBefore.server,
      isFirstServe: pt.isFirstServe,
      isSecondServe: pt.isSecondServe,
      gameScore,
      gamesScore,
      setNumber,
      isBreakPoint: bp,
      isGameBall: gb,
      isSetBall: sb,
      rallyLength,
      rallyDetails: pt.rallyDetails ?? null,
      pointDetails: pt,
      isTiebreak,
      gameIsDeuce: stateBefore.currentGame.isDeuce,
      gameAdvantage: stateBefore.currentGame.advantage,
      firstFault,
    });
  }

  return points;
}
