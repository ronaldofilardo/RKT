import type { Prisma } from "@prisma/client";

/**
 * Guarda de envelope de scoreState: `{ state, history }` com history array
 * e state truthy. Equivalente tipado do padrão `as any` anterior.
 */
function isScoreStateEnvelope(
  value: unknown,
): value is { state: unknown; history: unknown[] } {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { state?: unknown; history?: unknown };
  return Array.isArray(candidate.history) && Boolean(candidate.state);
}

export function resolvePersistedScoreState(
  incomingScoreState: unknown,
  existingScoreState: unknown,
): unknown | undefined {
  const receivedHasHistory = isScoreStateEnvelope(incomingScoreState);
  const existingHasHistory = isScoreStateEnvelope(existingScoreState);

  if (receivedHasHistory) {
    return incomingScoreState;
  }
  if (incomingScoreState && !existingScoreState) {
    return incomingScoreState;
  }
  if (incomingScoreState && existingScoreState && !receivedHasHistory && existingHasHistory) {
    return {
      state: incomingScoreState,
      history: existingScoreState.history,
    };
  }
  // Se incoming não existe mas existing existe, manter existing
  if (!incomingScoreState && existingScoreState) {
    return existingScoreState;
  }
  return incomingScoreState ?? undefined;
}

export function buildManualEditScoreState(newScoreState: unknown): { state: unknown; history: [] } {
  return { state: newScoreState, history: [] };
}
export async function recordScoreEditSegment(
  tx: Prisma.TransactionClient,
  matchId: string,
  options?: {
    isManualScoreEdit?: boolean;
    editedByUserId?: string;
    note?: string;
  },
  previousScoreState?: unknown,
  newScoreState?: unknown,
): Promise<void> {
  const shouldRecordSegment = Boolean(options?.isManualScoreEdit) && Boolean(newScoreState);
  if (!shouldRecordSegment) return;

  const maxRow = await tx.pointLog.aggregate({
    where: { matchId, voidedAt: null, sequenceNumber: { not: null } },
    _max: { sequenceNumber: true },
  });
  const maxSeq = maxRow._max.sequenceNumber ?? 0;

  const enrichedNewScoreState =
    typeof newScoreState === 'object' && newScoreState !== null
      ? { ...(newScoreState as Record<string, unknown>), pointLogSequenceAtEdit: maxSeq }
      : newScoreState;

  await tx.matchScoreEdit.create({
    data: {
      matchId,
      editedByUserId: options?.editedByUserId ?? null,
      note: options?.note ?? null,
      previousScoreState: (previousScoreState ?? {}) as Prisma.InputJsonValue,
      newScoreState: enrichedNewScoreState as Prisma.InputJsonValue,
    },
  });
}
