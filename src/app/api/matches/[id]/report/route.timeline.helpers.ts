import type { TimelinePoint } from '@/core/scoring/types';
import type { PointLogRow } from '@/core/scoring/timeline-rebuild';
import { describeScoreSnapshotForDisplay } from './route.helpers';
import type { getMatchScoreEdits } from '@/services/matchService';

type ScoreEdit = Awaited<ReturnType<typeof getMatchScoreEdits>>[number];

export function addScoreEditBreaks(
  timelinePoints: TimelinePoint[],
  pointLogs: PointLogRow[],
  scoreEdits: ScoreEdit[],
): TimelinePoint[] {
  if (scoreEdits.length === 0 || timelinePoints.length === 0) return timelinePoints;

  const editsByPoint = new Map<number, ScoreEdit[]>();
  for (const edit of scoreEdits) {
    const editTime = edit.editedAt.getTime();
    const pointIndex = pointLogs.findIndex(log => log.timestamp.getTime() > editTime);
    if (pointIndex !== -1 && timelinePoints[pointIndex]) {
      const list = editsByPoint.get(pointIndex) ?? [];
      list.push(edit);
      editsByPoint.set(pointIndex, list);
    }
  }

  for (const [pointIndex, edits] of editsByPoint) {
    if (edits.length === 1) {
      const edit = edits[0];
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
    } else {
      const first = edits[0];
      const last = edits[edits.length - 1];
      const notes = edits
        .map(e => e.note)
        .filter((n): n is string => !!n);
      timelinePoints[pointIndex] = {
        ...timelinePoints[pointIndex],
        segmentBreak: {
          editedAt: last.editedAt.toISOString(),
          previousLabel: describeScoreSnapshotForDisplay(first.previousScoreState),
          newLabel: describeScoreSnapshotForDisplay(last.newScoreState),
          editedByUserId: last.editedByUserId ?? undefined,
          note: notes.length > 0 ? notes.join(' → ') : undefined,
        },
      };
    }
  }

  return timelinePoints;
}
