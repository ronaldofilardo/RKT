import type { TimelinePoint } from '@/core/scoring/types';
import type { PlayerPointSummary, ReportSummary } from '@/core/report/report-types';

export type { PlayerPointSummary, ReportSummary } from '@/core/report/report-types';

const emptyPlayerSummary = (): PlayerPointSummary => ({
  pointsWon: 0,
  aces: 0,
  winners: 0,
  forcedErrors: 0,
  unforcedErrors: 0,
  doubleFaults: 0,
  breakPoints: 0,
  breakPointsWon: 0,
});

function incrementEvent(summary: PlayerPointSummary, point: TimelinePoint) {
  if (point.type === 'ACE') summary.aces += 1;
  if (point.type === 'WINNER') summary.winners += 1;
  if (point.type === 'FORCED_ERROR') summary.forcedErrors += 1;
  if (point.type === 'UNFORCED_ERROR') summary.unforcedErrors += 1;
  if (point.type === 'DOUBLE_FAULT') summary.doubleFaults += 1;
  if (point.isBreakPoint) summary.breakPoints += 1;
  if (point.isBreakPoint && point.winner === 'PLAYER_1') summary.breakPointsWon += 1;
}

function getEventOwner(point: TimelinePoint): 'PLAYER_1' | 'PLAYER_2' {
  const isError = point.type === 'FORCED_ERROR' || point.type === 'UNFORCED_ERROR' || point.type === 'DOUBLE_FAULT';
  if (!isError) return point.winner;
  return point.server === 'player1' ? 'PLAYER_1' : 'PLAYER_2';
}

function getPlayerSummary(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2') {
  const summary = emptyPlayerSummary();
  for (const point of points) {
    if (point.winner === player) summary.pointsWon += 1;
    if (getEventOwner(point) === player) incrementEvent(summary, point);
  }
  return summary;
}

function getSets(scoreState: unknown): ReportSummary['sets'] {
  if (!isRecord(scoreState) || !Array.isArray(scoreState.sets)) return [];
  return scoreState.sets.flatMap((set) => {
    if (!isRecord(set)) return [];
    const player1 = getNumber(set.player1);
    const player2 = getNumber(set.player2);
    return player1 === null || player2 === null ? [] : [{ player1, player2, isTiebreak: set.isTiebreak === true }];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function buildReportSummary(points: TimelinePoint[], scoreState: unknown): ReportSummary {
  return {
    totalPoints: points.length,
    player1: getPlayerSummary(points, 'PLAYER_1'),
    player2: getPlayerSummary(points, 'PLAYER_2'),
    sets: getSets(scoreState),
  };
}
