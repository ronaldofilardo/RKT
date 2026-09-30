import type { TimelinePoint } from '@/core/scoring/types';

export {
  enrichPointsFromHistory,
  isBreakPoint,
  isGameBall,
  isSetBall,
  getGameScoreLabel,
} from '@/core/scoring/scoring-logic';

export * from './timeline-format';
export * from './timeline-validation';
export * from './timeline-game-end';

export function filterTimelinePoints(
  points: TimelinePoint[],
  filters: {
    playerWinner?: 'PLAYER_1' | 'PLAYER_2';
    breakPointsOnly?: boolean;
    winnersOnly?: boolean;
    errorsOnly?: boolean;
  },
): TimelinePoint[] {
  return points.filter(p => {
    if (filters.playerWinner && p.winner !== filters.playerWinner) return false;
    if (filters.breakPointsOnly && !p.isBreakPoint) return false;
    if (filters.winnersOnly && p.type !== 'WINNER' && p.type !== 'ACE') return false;
    if (
      filters.errorsOnly &&
      p.type !== 'UNFORCED_ERROR' &&
      p.type !== 'FORCED_ERROR' &&
      p.type !== 'DOUBLE_FAULT'
    )
      return false;
    return true;
  });
}

export function countByFilter(
  points: TimelinePoint[],
  filter: (p: TimelinePoint) => boolean,
): number {
  return points.filter(filter).length;
}

export interface PointLogAudioMeta {
  pointLogId: string;
  hasAudioNote: boolean;
  audioNoteDuration: number | null;
}

export function enrichTimelineWithAudio(
  points: TimelinePoint[],
  pointLogs: PointLogAudioMeta[],
): TimelinePoint[] {
  const audioMap = new Map(pointLogs.map(pl => [pl.pointLogId, pl]));
  return points.map((p, i) => {
    const meta = pointLogs[i];
    if (meta && audioMap.has(meta.pointLogId)) {
      return {
        ...p,
        pointId: meta.pointLogId,
        hasAudioNote: meta.hasAudioNote,
        audioNoteDuration: meta.audioNoteDuration ?? undefined,
      };
    }
    return p;
  });
}
