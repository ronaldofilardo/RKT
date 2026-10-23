import type { Prisma } from '@prisma/client';

export interface VoidPointLogOptions {
  voidPointLogId?: string;
  voidLastPoint?: boolean;
  isUndo?: boolean;
}

async function voidLatestPoint(tx: Prisma.TransactionClient, matchId: string): Promise<void> {
  const lastLog = await tx.pointLog.findFirst({
    where: { matchId, voidedAt: null },
    orderBy: { sequenceNumber: 'desc' },
  });
  if (lastLog) {
    await tx.pointLog.update({
      where: { id: lastLog.id },
      data: { voidedAt: new Date(), sequenceNumber: null },
    });
  }
}

export async function voidPointLogSegment(
  tx: Prisma.TransactionClient,
  matchId: string,
  options: VoidPointLogOptions,
): Promise<void> {
  if (options.voidPointLogId) {
    const updateResult = await tx.pointLog.updateMany({
      where: { id: options.voidPointLogId, matchId, voidedAt: null },
      data: { voidedAt: new Date(), sequenceNumber: null },
    });
    if (updateResult.count === 0 && (options.voidLastPoint || options.isUndo)) {
      await voidLatestPoint(tx, matchId);
    }
  } else if (options.voidLastPoint || options.isUndo) {
    await voidLatestPoint(tx, matchId);
  }
}
