import type { TimelinePoint } from '@/core/scoring/types';
import type { ReportSummary, PlayerPointSummary } from '@/core/report/report-types';
import {
  isAcePoint,
  isDoubleFaultPoint,
  isRallyWinnerPoint,
  isForcedErrorPoint,
  isUnforcedErrorPoint,
} from '@/core/scoring/game-error-classify.logic';
import { computeCompletedGames } from '@/core/report/serve-return-stats';

export function buildPlayerSummary(
  points: TimelinePoint[],
  isPlayer1: boolean,
): PlayerPointSummary {
  const winner = isPlayer1 ? 'PLAYER_1' : 'PLAYER_2';
  const pointsWon = points.filter(p => p.winner === winner).length;
  const aces = points.filter(p => isAcePoint(p) && p.server === (isPlayer1 ? 'player1' : 'player2')).length;
  const doubleFaults = points.filter(p => isDoubleFaultPoint(p) && p.server === (isPlayer1 ? 'player1' : 'player2')).length;

  let winners = 0;
  let forcedErrors = 0;
  let unforcedErrors = 0;
  for (const p of points) {
    if (p.winner === winner) {
      if (isRallyWinnerPoint(p)) winners++;
    } else {
      if (isForcedErrorPoint(p)) forcedErrors++;
      else if (isUnforcedErrorPoint(p)) unforcedErrors++;
    }
  }

  const isServer = (p: TimelinePoint) =>
    (isPlayer1 && p.server === 'player1') || (!isPlayer1 && p.server === 'player2');
  const breakPoints = points.filter(p => p.isBreakPoint && !isServer(p)).length;
  const breakPointsWon = points.filter(p => p.isBreakPoint && !isServer(p) && p.winner === winner).length;

  return { pointsWon, aces, winners, forcedErrors, unforcedErrors, doubleFaults, breakPoints, breakPointsWon };
}

export function buildReportSummary(
  timelinePoints: TimelinePoint[],
): ReportSummary {
  const completed = computeCompletedGames(timelinePoints);
  const setGamesMap = new Map<number, { p1: number; p2: number; isTiebreak: boolean }>();

  for (const p of timelinePoints) {
    const s = p.setNumber;
    if (!setGamesMap.has(s)) setGamesMap.set(s, { p1: 0, p2: 0, isTiebreak: false });
    if (p.isTiebreak) setGamesMap.get(s)!.isTiebreak = true;
  }

  for (const g of completed) {
    const entry = setGamesMap.get(g.setNumber);
    if (entry) {
      if (g.winner === 'PLAYER_1') entry.p1++;
      else entry.p2++;
    }
  }

  const sets: ReportSummary['sets'] = [];
  for (const [, v] of setGamesMap) {
    sets.push({ player1: v.p1, player2: v.p2, isTiebreak: v.isTiebreak });
  }

  return {
    totalPoints: timelinePoints.length,
    player1: buildPlayerSummary(timelinePoints, true),
    player2: buildPlayerSummary(timelinePoints, false),
    sets,
  };
}
