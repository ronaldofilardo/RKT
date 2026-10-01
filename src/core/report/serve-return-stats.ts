import type { TimelinePoint } from '@/core/scoring/types';
import { isServer, isWinner, type ReturnStats, type ServeStats } from './types';

interface CompletedGame {
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

function computeServiceGames(points: TimelinePoint[], playerIndex: 1 | 2): Array<{ won: boolean; startIdx: number; endIdx: number }> {
  const targetServer = playerIndex === 1 ? 'player1' : 'player2';
  const targetWinner = playerIndex === 1 ? 'PLAYER_1' : 'PLAYER_2';

  const completed = computeCompletedGames(points);
  return completed
    .filter(g => !g.isTiebreak && g.server === targetServer)
    .map(g => ({
      won: g.winner === targetWinner,
      startIdx: g.startIdx,
      endIdx: g.endIdx,
    }));
}

export function isSecondServePoint(p: TimelinePoint): boolean {
  if (p.type === 'FAULT_FIRST') return false;
  if (p.type === 'DOUBLE_FAULT') return true;
  if (p.firstFault != null || p.pointDetails?.firstFaultDetail != null) return true;
  if (p.isSecondServe === true) return true;
  if (p.isFirstServe === false) return true;
  return false;
}

function isFirstServePoint(p: TimelinePoint): boolean {
  if (p.type === 'FAULT_FIRST') return false;
  return !isSecondServePoint(p);
}

export function computeServeStats(points: TimelinePoint[], playerIndex: 1 | 2): ServeStats {
  const servicePoints = points.filter(p => isServer(p, playerIndex) && p.type !== 'FAULT_FIRST');
  const totalPoints = servicePoints.length;

  const firstServeIn = servicePoints.filter(isFirstServePoint).length;
  const firstServePoints = servicePoints.filter(isFirstServePoint);
  const firstServePct = totalPoints > 0 ? (firstServeIn / totalPoints) * 100 : 0;

  const firstServePointsWon = firstServePoints.filter(p => isWinner(p, playerIndex)).length;
  const firstServePointsWonPct = firstServePoints.length > 0
    ? (firstServePointsWon / firstServePoints.length) * 100
    : 0;

  const secondServePoints = servicePoints.filter(isSecondServePoint);
  const secondServePointsWon = secondServePoints.filter(p => isWinner(p, playerIndex)).length;
  const secondServePointsWonPct = secondServePoints.length > 0
    ? (secondServePointsWon / secondServePoints.length) * 100
    : 0;

  const aces = servicePoints.filter(p => p.type === 'ACE').length;
  const doubleFaults = servicePoints.filter(p => p.type === 'DOUBLE_FAULT').length;

  const serviceGames = computeServiceGames(points, playerIndex);
  const serviceGamesPlayed = serviceGames.length;
  const serviceGamesWon = serviceGames.filter(g => g.won).length;
  const serviceGamesWonPct = serviceGamesPlayed > 0
    ? (serviceGamesWon / serviceGamesPlayed) * 100
    : 0;

  const breakPointsFaced = servicePoints.filter(p => p.isBreakPoint).length;
  const breakPointsSaved = servicePoints.filter(p => p.isBreakPoint && isWinner(p, playerIndex)).length;
  const breakPointsSavedPct = breakPointsFaced > 0
    ? (breakPointsSaved / breakPointsFaced) * 100
    : 0;

  return {
    totalPoints,
    firstServeIn,
    firstServePct,
    firstServePointsWon,
    firstServePointsWonPct,
    secondServePointsWon,
    secondServePointsWonPct,
    aces,
    doubleFaults,
    serviceGamesPlayed,
    serviceGamesWon,
    serviceGamesWonPct,
    breakPointsFaced,
    breakPointsSaved,
    breakPointsSavedPct,
  };
}

function computeReturnGames(points: TimelinePoint[], playerIndex: 1 | 2): Array<{ won: boolean }> {
  const opponentServer = playerIndex === 1 ? 'player2' : 'player1';
  const targetWinner = playerIndex === 1 ? 'PLAYER_1' : 'PLAYER_2';

  const completed = computeCompletedGames(points);
  return completed
    .filter(g => !g.isTiebreak && g.server === opponentServer)
    .map(g => ({
      won: g.winner === targetWinner,
    }));
}

export function computeReturnStats(points: TimelinePoint[], playerIndex: 1 | 2): ReturnStats {
  const returnPoints = points.filter(p => !isServer(p, playerIndex) && p.type !== 'FAULT_FIRST');
  const totalPoints = returnPoints.length;

  const firstServeReturns = returnPoints.filter(isFirstServePoint);
  const firstServeReturnPointsWon = firstServeReturns.filter(p => isWinner(p, playerIndex)).length;
  const firstServeReturnPointsWonPct = firstServeReturns.length > 0
    ? (firstServeReturnPointsWon / firstServeReturns.length) * 100
    : 0;

  const secondServeReturns = returnPoints.filter(isSecondServePoint);
  const secondServeReturnPointsWon = secondServeReturns.filter(p => isWinner(p, playerIndex)).length;
  const secondServeReturnPointsWonPct = secondServeReturns.length > 0
    ? (secondServeReturnPointsWon / secondServeReturns.length) * 100
    : 0;

  const returnGames = computeReturnGames(points, playerIndex);
  const returnGamesPlayed = returnGames.length;
  const returnGamesWon = returnGames.filter(g => g.won).length;
  const returnGamesWonPct = returnGamesPlayed > 0
    ? (returnGamesWon / returnGamesPlayed) * 100
    : 0;

  const breakPointOpportunities = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex)).length;
  const breakPointsConverted = points.filter(p => p.isBreakPoint && !isServer(p, playerIndex) && isWinner(p, playerIndex)).length;
  const breakPointsConvertedPct = breakPointOpportunities > 0
    ? (breakPointsConverted / breakPointOpportunities) * 100
    : 0;

  return {
    totalPoints,
    firstServeReturnPointsWon,
    firstServeReturnPointsWonPct,
    secondServeReturnPointsWon,
    secondServeReturnPointsWonPct,
    returnGamesPlayed,
    returnGamesWon,
    returnGamesWonPct,
    breakPointOpportunities,
    breakPointsConverted,
    breakPointsConvertedPct,
  };
}
