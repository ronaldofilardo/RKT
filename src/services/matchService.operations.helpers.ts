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
  existingScoreState: unknown,
  reason?: string,
  note?: string,
  winnerId?: string,
) {
  const updateData: Record<string, unknown> = {
    state: 'FINISHED',
    finishedAt: new Date(),
    finishReason: reason || 'COMPLETED',
  };
  const receivedHasHistory = scoreState && typeof scoreState === 'object'
    && Array.isArray((scoreState as any).history)
    && (scoreState as any).state;
  if (receivedHasHistory || (scoreState && !existingScoreState)) updateData.scoreState = scoreState;
  if (note) updateData.finishNote = note;
  if (winnerId) updateData.winnerId = winnerId;
  return updateData;
}
