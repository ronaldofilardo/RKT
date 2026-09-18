import type { TimelinePoint } from '@/core/scoring/types';
import { isServer, isWinner, type ReturnStats, type ServeStats } from './types';

function computeServiceGames(points: TimelinePoint[], playerIndex: 1 | 2): Array<{ won: boolean; startIdx: number; endIdx: number }> {
  const games: Array<{ won: boolean; startIdx: number; endIdx: number }> = [];
  let gameStart = 0;
  let currentSet = 1;
  let currentGamesP1 = 0;
  let currentGamesP2 = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    if (p.setNumber > currentSet) {
      currentSet = p.setNumber;
      currentGamesP1 = 0;
      currentGamesP2 = 0;
    }

    const gameScore = p.gamesScore;
    const newGamesP1 = gameScore.player1;
    const newGamesP2 = gameScore.player2;

    if (isServer(p, playerIndex)) {
      const prevGames = currentGamesP1 + currentGamesP2;
      const newGames = newGamesP1 + newGamesP2;
      if (newGames > prevGames || i === points.length - 1) {
        const won = isWinner(p, playerIndex);
        games.push({ won, startIdx: gameStart, endIdx: i });
        gameStart = i + 1;
      }
    }

    currentGamesP1 = newGamesP1;
    currentGamesP2 = newGamesP2;
  }

  return games;
}

export function computeServeStats(points: TimelinePoint[], playerIndex: 1 | 2): ServeStats {
  const servicePoints = points.filter(p => isServer(p, playerIndex) && p.type !== 'FAULT_FIRST');
  const totalPoints = servicePoints.length;

  const firstServeIn = servicePoints.filter(p => p.isFirstServe && p.type !== 'FAULT_FIRST').length;
  const firstServePoints = servicePoints.filter(p => p.isFirstServe);
  const firstServePct = totalPoints > 0 ? (firstServeIn / totalPoints) * 100 : 0;

  const firstServePointsWon = firstServePoints.filter(p => isWinner(p, playerIndex)).length;
  const firstServePointsWonPct = firstServePoints.length > 0
    ? (firstServePointsWon / firstServePoints.length) * 100
    : 0;

  const secondServePoints = servicePoints.filter(p => p.isSecondServe);
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

  const breakPointsFaced = servicePoints.filter(p => p.isBreakPoint && !isWinner(p, playerIndex)).length;
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
  const games: Array<{ won: boolean }> = [];
  let currentSet = 1;
  let currentGamesP1 = 0;
  let currentGamesP2 = 0;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.setNumber > currentSet) {
      currentSet = p.setNumber;
      currentGamesP1 = 0;
      currentGamesP2 = 0;
    }

    const gameScore = p.gamesScore;
    const prevGames = currentGamesP1 + currentGamesP2;
    const newGames = gameScore.player1 + gameScore.player2;

    if (!isServer(p, playerIndex) && newGames > prevGames) {
      games.push({ won: isWinner(p, playerIndex) });
    }

    currentGamesP1 = gameScore.player1;
    currentGamesP2 = gameScore.player2;
  }

  return games;
}

export function computeReturnStats(points: TimelinePoint[], playerIndex: 1 | 2): ReturnStats {
  const returnPoints = points.filter(p => !isServer(p, playerIndex) && p.type !== 'FAULT_FIRST');
  const totalPoints = returnPoints.length;

  const firstServeReturns = returnPoints.filter(p => p.isFirstServe);
  const firstServeReturnPointsWon = firstServeReturns.filter(p => isWinner(p, playerIndex)).length;
  const firstServeReturnPointsWonPct = firstServeReturns.length > 0
    ? (firstServeReturnPointsWon / firstServeReturns.length) * 100
    : 0;

  const secondServeReturns = returnPoints.filter(p => p.isSecondServe);
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
