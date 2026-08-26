import type { TimelinePoint } from '@/core/scoring/types';
import type { PointLogRow } from '@/components/scoring/timeline-rebuild';
import { describeScoreSnapshotForDisplay } from './route.helpers';
import type { getMatchScoreEdits } from '@/services/matchService';

type ScoreEdit = Awaited<ReturnType<typeof getMatchScoreEdits>>[number];

export function addScoreEditBreaks(
  timelinePoints: TimelinePoint[],
  pointLogs: PointLogRow[],
  scoreEdits: ScoreEdit[],
): TimelinePoint[] {
  if (scoreEdits.length === 0 || timelinePoints.length === 0) return timelinePoints;
  for (const edit of scoreEdits) {
    const editTime = edit.editedAt.getTime();
    const pointIndex = pointLogs.findIndex(log => log.timestamp.getTime() > editTime);
    if (pointIndex !== -1 && timelinePoints[pointIndex]) {
      timelinePoints[pointIndex] = {
        ...timelinePoints[pointIndex],
        segmentBreak: {
          editedAt: edit.editedAt.toISOString(),
          previousLabel: describeScoreSnapshotForDisplay(edit.previousScoreState),
          newLabel: describeScoreSnapshotForDisplay(edit.newScoreState),
          editedByUserId: edit.editedByUserId ?? undefined,
          note: edit.note ?? undefined,
        },
      };
    }
  }
  return timelinePoints;
}
