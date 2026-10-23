import type { TimelinePoint } from '@/core/scoring/types';
import type { ReportSummary, PlayerPointSummary } from '@/core/report/report-types';

export function buildPlayerSummary(
  points: TimelinePoint[],
  isPlayer1: boolean,
): PlayerPointSummary {
  const winner = isPlayer1 ? 'PLAYER_1' : 'PLAYER_2';
  const pointsWon = points.filter(p => p.winner === winner).length;
  const aces = points.filter(p => p.type === 'ACE' && p.server === (isPlayer1 ? 'player1' : 'player2')).length;
  const doubleFaults = points.filter(p => p.type === 'DOUBLE_FAULT' && p.server === (isPlayer1 ? 'player1' : 'player2')).length;

  let winners = 0;
  let forcedErrors = 0;
  let unforcedErrors = 0;
  for (const p of points) {
    const tipo = p.rallyDetails?.tipo;
    const isWinnerPoint = tipo === 'winner' || p.type === 'WINNER';
    const isForcedErrorPoint = tipo === 'erro_forcado' || p.type === 'FORCED_ERROR';
    const isUnforcedErrorPoint = tipo === 'erro_nao_forcado' || p.type === 'UNFORCED_ERROR';

    if (p.winner === winner) {
      if (isWinnerPoint) winners++;
    } else {
      if (isForcedErrorPoint) forcedErrors++;
      else if (isUnforcedErrorPoint) unforcedErrors++;
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
  const sets: ReportSummary['sets'] = [];
  const setMap = new Map<number, { p1: number; p2: number; isTiebreak: boolean }>();

  for (const p of timelinePoints) {
    const s = p.setNumber;
    if (!setMap.has(s)) setMap.set(s, { p1: 0, p2: 0, isTiebreak: false });
    const entry = setMap.get(s)!;
    if (p.winner === 'PLAYER_1') entry.p1++;
    else entry.p2++;
    if (p.isTiebreak) entry.isTiebreak = true;
  }

  for (const [, v] of setMap) {
    sets.push({ player1: v.p1, player2: v.p2, isTiebreak: v.isTiebreak });
  }

  return {
    totalPoints: timelinePoints.length,
    player1: buildPlayerSummary(timelinePoints, true),
    player2: buildPlayerSummary(timelinePoints, false),
    sets,
  };
}
