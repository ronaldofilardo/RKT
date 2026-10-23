import type { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';
import { TransactionError } from './route.logic';

export async function resolveNextSequence(
  tx: Prisma.TransactionClient,
  matchId: string,
  receivedSequenceNumber: number | undefined,
): Promise<number> {
  if (typeof tx.pointLog.updateMany === 'function') {
    await tx.pointLog.updateMany({
      where: { matchId, voidedAt: { not: null }, sequenceNumber: { not: null } },
      data: { sequenceNumber: null },
    });
  }

  // P2-12 FIX: Usar MAX(sequenceNumber) + 1 em vez de count + 1
  // para evitar conflito de unique constraint após anulação de pontos.
  const maxRow = await tx.pointLog.aggregate({
    where: { matchId, voidedAt: null, sequenceNumber: { not: null } },
    _max: { sequenceNumber: true },
  });
  const nextSequenceNumber = (maxRow._max.sequenceNumber ?? 0) + 1;

  if (receivedSequenceNumber !== undefined && receivedSequenceNumber !== nextSequenceNumber) {
    logger.point.sequenceConflict({
      expected: nextSequenceNumber,
      received: receivedSequenceNumber,
    });
    throw new TransactionError(
      `Conflito de sequência: esperado ${nextSequenceNumber}, recebido ${receivedSequenceNumber}`,
      409,
      'SEQUENCE_CONFLICT',
      { expectedSequence: nextSequenceNumber },
    );
  }

  return nextSequenceNumber;
}
