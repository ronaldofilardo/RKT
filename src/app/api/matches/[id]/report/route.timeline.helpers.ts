import type { TimelinePoint } from '@/core/scoring/types';
import type { PointLogRow } from '@/core/scoring/timeline-rebuild';
import { describeTimelinePoint } from './route.helpers';
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
    const prevPoint = pointIndex > 0 ? timelinePoints[pointIndex - 1] : null;
    const currentPoint = timelinePoints[pointIndex];
    const lastEdit = edits[edits.length - 1];
    const notes = edits
      .map(e => e.note)
      .filter((n): n is string => !!n);

    timelinePoints[pointIndex] = {
      ...currentPoint,
      segmentBreak: {
        editedAt: lastEdit.editedAt.toISOString(),
        previousLabel: prevPoint ? describeTimelinePoint(prevPoint) : '–',
        newLabel: describeTimelinePoint(currentPoint),
        editedByUserId: lastEdit.editedByUserId ?? undefined,
        note: notes.length > 0 ? notes.join(' → ') : undefined,
      },
    };
  }

  return timelinePoints;
}
