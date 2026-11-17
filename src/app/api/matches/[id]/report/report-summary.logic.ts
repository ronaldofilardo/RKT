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
  const completedPoints = points.filter(p => p.type !== 'FAULT_FIRST');
  const winner = isPlayer1 ? 'PLAYER_1' : 'PLAYER_2';
  const pointsWon = completedPoints.filter(p => p.winner === winner).length;
  const aces = completedPoints.filter(p => isAcePoint(p) && p.server === (isPlayer1 ? 'player1' : 'player2')).length;
  const doubleFaults = completedPoints.filter(p => isDoubleFaultPoint(p) && p.server === (isPlayer1 ? 'player1' : 'player2')).length;

  let winners = 0;
  let forcedErrors = 0;
  let unforcedErrors = 0;
  for (const p of completedPoints) {
    if (p.winner === winner) {
      if (isRallyWinnerPoint(p)) winners++;
    } else {
      if (isForcedErrorPoint(p)) forcedErrors++;
      else if (isUnforcedErrorPoint(p)) unforcedErrors++;
    }
  }

  const isServer = (p: TimelinePoint) =>
    (isPlayer1 && p.server === 'player1') || (!isPlayer1 && p.server === 'player2');
  const breakPoints = completedPoints.filter(p => p.isBreakPoint && !isServer(p)).length;
  const breakPointsWon = completedPoints.filter(p => p.isBreakPoint && !isServer(p) && p.winner === winner).length;

  return { pointsWon, aces, winners, forcedErrors, unforcedErrors, doubleFaults, breakPoints, breakPointsWon };
}

export function buildReportSummary(
  timelinePoints: TimelinePoint[],
): ReportSummary {
  const completedPoints = timelinePoints.filter(p => p.type !== 'FAULT_FIRST');
  const completed = computeCompletedGames(completedPoints);
  const setGamesMap = new Map<number, { p1: number; p2: number; isTiebreak: boolean; p1Points: number; p2Points: number }>();

  for (const p of completedPoints) {
    const s = p.setNumber;
    if (!setGamesMap.has(s)) setGamesMap.set(s, { p1: 0, p2: 0, isTiebreak: false, p1Points: 0, p2Points: 0 });
    const entry = setGamesMap.get(s)!;
    if (p.isTiebreak) entry.isTiebreak = true;
    if (p.winner === 'PLAYER_1') entry.p1Points++;
    else if (p.winner === 'PLAYER_2') entry.p2Points++;
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
    if (v.isTiebreak && v.p1 === 0 && v.p2 === 0 && (v.p1Points > 0 || v.p2Points > 0)) {
      sets.push({
        player1: v.p1Points > v.p2Points ? 1 : 0,
        player2: v.p2Points > v.p1Points ? 1 : 0,
        isTiebreak: true,
      });
    } else {
      sets.push({ player1: v.p1, player2: v.p2, isTiebreak: v.isTiebreak });
    }
  }

  return {
    totalPoints: completedPoints.length,
    player1: buildPlayerSummary(completedPoints, true),
    player2: buildPlayerSummary(completedPoints, false),
    sets,
  };
}
