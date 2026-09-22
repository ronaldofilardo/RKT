export const ALLOWED_MATCH_FIELDS = [
  'nickname', 'sportType', 'courtType', 'visibility', 'openForAnnotation',
  'scheduledAt', 'initialServerId', 'tournamentName', 'category', 'roundName',
  'bracketType', 'temperature', 'humidity',
] as const;

type AllowedField = (typeof ALLOWED_MATCH_FIELDS)[number];

export function sanitizeMatchUpdate(data: Record<string, unknown>): Partial<Record<AllowedField, unknown>> {
  const sanitized: Partial<Record<AllowedField, unknown>> = {};
  for (const key of ALLOWED_MATCH_FIELDS) {
    if (data[key] !== undefined) sanitized[key] = data[key];
  }
  return sanitized;
}

export function buildMatchUpdateData(sanitized: Partial<Record<AllowedField, unknown>>) {
  const result: Record<string, unknown> = {};
  const assign = (key: AllowedField, value: unknown = sanitized[key]) => {
    if (value !== undefined) result[key] = value;
  };
  assign('nickname');
  assign('sportType');
  assign('courtType');
  assign('visibility');
  assign('openForAnnotation');
  if (sanitized.scheduledAt !== undefined) result.scheduledAt = new Date(sanitized.scheduledAt as string);
  assign('initialServerId');
  assign('tournamentName');
  assign('category');
  assign('roundName');
  assign('bracketType');
  assign('temperature');
  assign('humidity');
  return result;
}

export function buildFinishUpdateData(
  scoreState: unknown,
  reason?: string,
  note?: string,
  winnerId?: string,
) {
  const updateData: Record<string, unknown> = {
    state: 'FINISHED',
    finishedAt: new Date(),
    finishReason: reason || 'COMPLETED',
  };
  if (scoreState) updateData.scoreState = scoreState;
  if (note) updateData.finishNote = note;
  if (winnerId) updateData.winnerId = winnerId;
  return updateData;
}

export function resolvePersistedScoreState(
  incomingScoreState: unknown,
  existingScoreState: unknown,
): unknown | undefined {
  const receivedHasHistory =
    incomingScoreState && typeof incomingScoreState === 'object' &&
    Array.isArray((incomingScoreState as any).history) &&
    (incomingScoreState as any).state;

  const existingHasHistory =
    existingScoreState && typeof existingScoreState === 'object' &&
    Array.isArray((existingScoreState as any).history) &&
    (existingScoreState as any).state;

  if (receivedHasHistory) {
    return incomingScoreState;
  }
  if (incomingScoreState && !existingScoreState) {
    return incomingScoreState;
  }
  if (incomingScoreState && existingScoreState && !receivedHasHistory && existingHasHistory) {
    return {
      state: incomingScoreState,
      history: (existingScoreState as any).history,
    };
  }
  // Se incoming não existe mas existing existe, manter existing
  if (!incomingScoreState && existingScoreState) {
    return existingScoreState;
  }
  return incomingScoreState ?? undefined;
}

export async function recordScoreEditSegment(
  tx: any,
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

  await tx.matchScoreEdit.create({
    data: {
      matchId,
      editedByUserId: options?.editedByUserId ?? null,
      note: options?.note ?? null,
      previousScoreState: previousScoreState as any,
      newScoreState: newScoreState as any,
    },
  });
}

export function buildTransitionUpdateData(
  newState: string,
  initialServerId?: string,
  scoreState?: unknown,
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {
    state: newState,
    version: { increment: 1 },
  };
  if (newState === 'IN_PROGRESS') {
    updateData.startedAt = new Date();
    updateData.finishedAt = null;
    updateData.winnerId = null;
  }
  if (newState === 'FINISHED') updateData.finishedAt = new Date();
  if (initialServerId) updateData.initialServerId = initialServerId;
  if (scoreState) updateData.scoreState = scoreState as any;
  return updateData;
}

