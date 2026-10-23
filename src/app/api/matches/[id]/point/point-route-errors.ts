import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class TransactionError extends Error {
  status: number;
  code: string;
  extra?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code || status.toString();
    this.extra = extra;
  }
}

export async function reportPointRouteFailure(
  error: unknown,
  requestId: string,
  requestClientEventId?: string,
): Promise<NextResponse> {
  if (error instanceof TransactionError) {
    return NextResponse.json(
      { error: error.code, message: error.message, ...(error.extra ?? {}) },
      { status: error.status },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = (error.meta?.target as string[] | string | undefined) ?? [];
    const isSequenceConflict = Array.isArray(target)
      ? target.includes('sequenceNumber')
      : typeof target === 'string' && target.includes('sequenceNumber');

    if (isSequenceConflict) {
      const pointCount = await prisma.pointLog.count({ where: { matchId: requestId, voidedAt: null } });
      return NextResponse.json(
        {
          error: 'SEQUENCE_CONFLICT',
          message: 'Conflito de sequência ao registrar ponto. Sincronize e tente novamente.',
          expectedSequence: pointCount + 1,
        },
        { status: 409 },
      );
    }

    if (requestClientEventId) {
      const [existingPoint, currentMatch] = await Promise.all([
        prisma.pointLog.findFirst({
          where: { matchId: requestId, clientEventId: requestClientEventId },
          select: { id: true },
        }),
        prisma.match.findUnique({ where: { id: requestId }, select: { scoreState: true, version: true } }),
      ]);
      if (existingPoint && currentMatch) {
        return NextResponse.json({
          scoreState: currentMatch.scoreState,
          version: currentMatch.version,
          pointLogId: existingPoint.id,
        });
      }
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json(
      {
        error: 'VERSION_CONFLICT',
        message: 'Conflito de concorrência: outro anotador registrou um ponto antes. Recarregue e tente novamente.',
      },
      { status: 409 },
    );
  }

  logger.point.api.error(error);
  const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
  return NextResponse.json({ error: 'INTERNAL_ERROR', message: errorMessage }, { status: 500 });
}
