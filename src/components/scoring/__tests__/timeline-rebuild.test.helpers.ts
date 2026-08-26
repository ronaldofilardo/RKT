import type { TimelinePoint } from '@/core/scoring/types';
import type { PointLogRow } from '../timeline-rebuild';

export function buildTimelineRegressionFixture(makePointLog: (seq: number, winnerId: string, type: string, rallyDetails: any) => PointLogRow, makeHistoryTimeline: (pointNumber: number, type: string, winnerId: string) => TimelinePoint, player1Id: string, player2Id: string) {
  const pointLogs: PointLogRow[] = [];
  for (let i = 1; i <= 24; i++) {
    pointLogs.push(makePointLog(i, i % 2 === 0 ? player1Id : player2Id, i % 5 === 0 ? 'DOUBLE_FAULT' : 'ACE', { situacao: 'fundo', golpe: 'fh', tipo: 'winner', vencedor: 'sacador', previewBalls: 1 }));
  }
  const history: TimelinePoint[] = [];
  for (let i = 17; i <= 24; i++) {
    history.push(makeHistoryTimeline(i - 16, 'ACE', i % 2 === 0 ? player1Id : player2Id));
  }
  return { pointLogs, history };
}

function assertDetailedPoints(result: TimelinePoint[]) {
  for (const point of result) {
    expect(point.rallyDetails).not.toBeNull();
    expect(point.rallyDetails?.golpe).toBe('fh');
  }
  expect(result.every((point) => point.pointId?.startsWith('log-'))).toBe(true);
}

function assertCoherentScores(result: TimelinePoint[]) {
  for (let i = 1; i < result.length; i++) {
    const point = result[i];
    const isAllZero = point.gamesScore.player1 === 0 && point.gamesScore.player2 === 0 && point.gameScore.player1 === 0 && point.gameScore.player2 === 0 && point.setNumber === 0;
    expect(isAllZero).toBe(false);
  }
}

export function assertTimelineRegression(result: TimelinePoint[]) {
  expect(result).toHaveLength(24);
  expect(result[23].pointId).toBe('log-24');
  expect(result[0].pointNumber).toBe(1);
  expect(result[0].pointId).toBe('log-1');
  expect(result[0].rallyDetails).not.toBeNull();
  expect(result[0].rallyDetails?.situacao).toBe('fundo');
  expect(result[0].gamesScore).toEqual({ player1: 0, player2: 0 });
  expect(result[0].setNumber).toBe(1);
  assertDetailedPoints(result);
  assertCoherentScores(result);
}
