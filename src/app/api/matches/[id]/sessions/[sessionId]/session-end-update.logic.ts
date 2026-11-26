import type { updateSession } from '@/services/sessionService';

type SessionUpdateData = Parameters<typeof updateSession>[1];

/** Serializa o estado final (string ou objeto) para snapshot. */
export function serializeState(state: unknown): string | null {
  if (!state) return null;
  return typeof state === 'string' ? state : JSON.stringify(state);
}

/** Monta o payload de update da sessão conforme o novo status informado. */
export function buildEndSessionUpdate(
  status: SessionUpdateData['status'],
  finalState: unknown,
  matchScoreState: unknown,
): SessionUpdateData {
  const updateData: SessionUpdateData = { status };

  if (status === 'IN_PROGRESS') {
    updateData.isActive = true;
    updateData.updatedAt = new Date();
  }

  if (status === 'ABANDONED') {
    updateData.isActive = false;
    updateData.matchStateSnapshot = serializeState(finalState || matchScoreState);
  }

  if (status === 'COMPLETED') {
    updateData.isActive = false;
    updateData.endedAt = new Date();
    updateData.finalStateSnapshot = serializeState(finalState || matchScoreState);
  }

  return updateData;
}
