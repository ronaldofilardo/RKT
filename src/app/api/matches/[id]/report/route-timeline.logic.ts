import type { TimelinePoint } from '@/core/scoring/types';
import type { PointLogRow } from '@/core/scoring/timeline-rebuild';
import { describeTimelinePoint, describeScoreSnapshotForDisplay } from './route.logic';
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
    const newScoreState = edit.newScoreState as { pointLogSequenceAtEdit?: number; state?: { pointLogSequenceAtEdit?: number } } | null;
    const seqAtEdit = newScoreState?.pointLogSequenceAtEdit ?? newScoreState?.state?.pointLogSequenceAtEdit;
    let pointIndex = -1;
    if (typeof seqAtEdit === 'number') {
      pointIndex = pointLogs.findIndex(log => (log.sequenceNumber ?? 0) > seqAtEdit);
    } else {
      const editTime = edit.editedAt.getTime();
      pointIndex = pointLogs.findIndex(log => log.timestamp.getTime() > editTime);
    }
    if (pointIndex === -1) {
      // edição após o último ponto: marcador no fim
      pointIndex = timelinePoints.length - 1;
    }
    if (pointIndex >= 0 && timelinePoints[pointIndex]) {
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
        previousLabel: lastEdit.previousScoreState
          ? describeScoreSnapshotForDisplay(lastEdit.previousScoreState)
          : (prevPoint ? describeTimelinePoint(prevPoint) : '–'),
        newLabel: lastEdit.newScoreState
          ? describeScoreSnapshotForDisplay(lastEdit.newScoreState)
          : describeTimelinePoint(currentPoint),
        editedByUserId: lastEdit.editedByUserId ?? undefined,
        note: notes.length > 0 ? notes.join(' → ') : undefined,
      },
    };
  }

  return timelinePoints;
}
