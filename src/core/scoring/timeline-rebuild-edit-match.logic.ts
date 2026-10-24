import { unwrapStateEnvelope } from './state-envelope';
import type { TimelineScoreEdit } from './timeline-rebuild-simulate.logic';
import type { PointLogRow } from './point-log-merge';

/**
 * Avalia se uma edição manual de placar deve preceder um dado PointLog na timeline.
 * Usa pointLogSequenceAtEdit quando disponível (evitando distorções de relógio);
 * caso contrário, utiliza timestamp como critério de fallback.
 */
export function doesEditPrecedePointLog(edit: TimelineScoreEdit, log: PointLogRow): boolean {
  try {
    const raw = edit.newScoreState;
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const unpacked = unwrapStateEnvelope(parsed);
    const seqAtEdit =
      (unpacked as { pointLogSequenceAtEdit?: number } | null)?.pointLogSequenceAtEdit ??
      (parsed as { pointLogSequenceAtEdit?: number } | null)?.pointLogSequenceAtEdit;

    if (typeof seqAtEdit === 'number') {
      return (log.sequenceNumber ?? 0) > seqAtEdit;
    }
    return edit.editedAt.getTime() < log.timestamp.getTime();
  } catch {
    return edit.editedAt.getTime() < log.timestamp.getTime();
  }
}
