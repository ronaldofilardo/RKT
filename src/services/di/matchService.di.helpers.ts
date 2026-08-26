import type { CreateMatchInput, MatchFinishReason, MatchFormat } from '@/schemas/contracts';
import type { MatchUpsertInput } from '@/infrastructure/ports/match.repository.port';

export const ALLOWED_MATCH_FIELDS = [
  'nickname', 'sportType', 'courtType', 'visibility', 'openForAnnotation',
  'scheduledAt', 'initialServerId', 'tournamentName', 'category', 'roundName',
  'bracketType', 'temperature', 'humidity',
] as const;

type AllowedField = (typeof ALLOWED_MATCH_FIELDS)[number];

function buildMatchFormatFields(data: CreateMatchInput) {
  return {
    format: data.format as MatchFormat,
    sportType: data.sportType || 'TENNIS',
    courtType: data.courtType || null,
    nickname: data.nickname || null,
    visibility: data.visibility || 'PUBLIC',
    openForAnnotation: data.openForAnnotation || false,
  };
}

function buildMatchMetadataFields(data: CreateMatchInput) {
  return {
    tournamentName: data.tournamentName || null,
    category: data.category || null,
    round: data.round || data.roundName || null,
    bracketType: data.bracketType || null,
    temperature: data.temperature || null,
    humidity: data.humidity || null,
  };
}

function buildMatchOptionalFields(data: CreateMatchInput, createdByUserId?: string) {
  return {
    ...(data.initialServerId ? { initialServerId: data.initialServerId } : {}),
    scheduledAt: data.scheduledAt || null,
    ...(createdByUserId ? { createdByUserId } : {}),
  };
}

export function buildMatchUpsertInput(data: CreateMatchInput, createdByUserId?: string): MatchUpsertInput {
  return {
    ...buildMatchFormatFields(data),
    ...buildMatchMetadataFields(data),
    player1Id: data.player1Id,
    player2Id: data.player2Id,
    ...buildMatchOptionalFields(data, createdByUserId),
  };
}

export function sanitizeMatchUpdate(data: Record<string, unknown>): Partial<Record<AllowedField, unknown>> {
  const result: Partial<Record<AllowedField, unknown>> = {};
  for (const key of ALLOWED_MATCH_FIELDS) {
    if (data[key] !== undefined) result[key] = data[key];
  }
  return result;
}

export function buildMatchUpdateData(sanitized: Partial<Record<AllowedField, unknown>>) {
  const result: Record<string, unknown> = {};
  const assign = (key: AllowedField) => {
    if (sanitized[key] !== undefined) result[key] = sanitized[key];
  };
  ALLOWED_MATCH_FIELDS.filter((key) => key !== 'scheduledAt').forEach(assign);
  if (sanitized.scheduledAt !== undefined) result.scheduledAt = new Date(sanitized.scheduledAt as string);
  return result;
}

function isScoreEnvelope(value: unknown): value is { history: unknown[]; state: unknown } {
  return typeof value === 'object' && value !== null && Array.isArray((value as { history?: unknown }).history) && Boolean((value as { state?: unknown }).state);
}

export function buildFinishUpdateData(
  scoreState: unknown,
  existingScoreState: unknown,
  reason?: MatchFinishReason,
  note?: string,
  winnerId?: string,
) {
  const updateData: Record<string, unknown> = {
    state: 'FINISHED', finishedAt: new Date(), finishReason: reason || 'COMPLETED',
  };
  const hasHistory = isScoreEnvelope(scoreState);
  if (hasHistory || (scoreState && !existingScoreState)) updateData.scoreState = scoreState;
  if (note) updateData.finishNote = note;
  if (winnerId) updateData.winnerId = winnerId;
  return updateData;
}
