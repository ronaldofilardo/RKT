import type { Prisma } from '@prisma/client';
import type { PointFlowInput } from '@/schemas/contracts';
import { logger } from '@/lib/logger';
import { buildAnnotationsPayload } from './route.logic';
import type { PointActorFinals } from './route-load.logic';

function resolveValidatedTimestamp(
  match: { startedAt: Date | null; createdAt: Date },
  timestamp: PointFlowInput['timestamp'],
): Date {
  const nowMs = Date.now();

  if (!timestamp) return new Date(nowMs);

  const clientMs = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();

  const maxAllowedFuture = nowMs + 5 * 60 * 1000;
  const matchStartMs = match.startedAt ? new Date(match.startedAt).getTime() : match.createdAt.getTime();
  const minAllowedPast = matchStartMs - 60 * 60 * 1000;

  if (clientMs > maxAllowedFuture) {
    logger.warn({
      message: '[POST /point] client timestamp in future clamped to now',
      clientMs,
      nowMs,
    });
    return new Date(nowMs);
  }

  if (clientMs < minAllowedPast) {
    logger.warn({
      message: '[POST /point] client timestamp too far in past clamped to match start',
      clientMs,
      matchStartMs,
    });
    return new Date(matchStartMs);
  }

  return new Date(clientMs);
}

export async function createPointLogEntry(params: {
  tx: Prisma.TransactionClient;
  match: { id: string; startedAt: Date | null; createdAt: Date };
  data: PointFlowInput;
  finals: PointActorFinals;
  nextSequenceNumber: number;
}): Promise<{ id: string }> {
  const { tx, match, data, finals, nextSequenceNumber } = params;

  const annotations = buildAnnotationsPayload(data, {
    hitterId: finals.finalHitterId,
    receiverId: finals.calculatedReceiverId,
    courtSide: finals.calculatedCourtSide,
  });

  logger.point.creatingPointLog({
    winnerId: data.winnerId,
    type: data.type,
    rallyLength: data.rallyLength,
  });

  const validatedTimestamp = resolveValidatedTimestamp(match, data.timestamp);

  return tx.pointLog.create({
    data: {
      matchId: match.id,
      winnerId: data.winnerId,
      type: data.type,
      serverId: finals.finalServerId as string,
      timestamp: validatedTimestamp,
      annotations,
      sequenceNumber: nextSequenceNumber,
      clientEventId: data.clientEventId,
    },
  });
}
