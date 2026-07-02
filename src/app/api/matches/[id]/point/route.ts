import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PointFlowInputSchema } from '@/schemas/contracts';
import { requireRole } from '@/lib/auth';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringState } from '@/core/scoring/types';
import { emitMatchEvent } from '@/lib/match-events';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = PointFlowInputSchema.safeParse(body);

    if (!parsed.success) {
      console.error('[POINT VALIDATION ERROR]', JSON.stringify({
        body,
        issues: parsed.error.issues,
        flattened: parsed.error.flatten(),
      }));
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result: ScoringState | null = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findFirst({
        where: { id },
        include: { player1: true, player2: true },
      });

      if (!match) {
        throw new TransactionError('Partida não encontrada', 404, 'MATCH_NOT_FOUND');
      }

      if (match.state !== 'IN_PROGRESS') {
        throw new TransactionError('Partida não está em andamento', 422, 'MATCH_NOT_IN_PROGRESS');
      }

      if (!match.initialServerId) {
        throw new TransactionError('Defina o primeiro sacador antes de pontuar', 422, 'MATCH_NOT_STARTED');
      }

      if (parsed.data.sequenceNumber) {
        const pointLogCount = await tx.pointLog.count({ where: { matchId: id } });
        if (parsed.data.sequenceNumber !== pointLogCount + 1) {
          throw new TransactionError(
            `Conflito de sequência: esperado ${pointLogCount + 1}, recebido ${parsed.data.sequenceNumber}`,
            409,
            'SEQUENCE_CONFLICT',
            { expectedSequence: pointLogCount + 1 }
          );
        }
      }

      const engine = match.scoreState
        ? ScoringEngine.fromSerialized(
            {
              format: match.format,
              player1Id: match.player1Id,
              player2Id: match.player2Id,
              initialServerId: match.initialServerId,
            },
            JSON.stringify(match.scoreState)
          )
        : new ScoringEngine({
            format: match.format,
            player1Id: match.player1Id,
            player2Id: match.player2Id,
            initialServerId: match.initialServerId,
          });

      const newState = engine.applyPoint(parsed.data);

      const isMatchFinished = newState.isFinished;

      await tx.match.update({
        where: { id, version: match.version },
        data: {
          scoreState: newState as any,
          version: { increment: 1 },
          ...(isMatchFinished ? { state: 'FINISHED', finishedAt: new Date() } : {}),
        },
      });

      const annotations =
        parsed.data.annotations ??
        (parsed.data.rallyDetails
          ? {
              rallyDetails: parsed.data.rallyDetails,
              rallyLength: parsed.data.rallyLength,
              isFirstServe: parsed.data.isFirstServe,
              isSecondServe: parsed.data.isSecondServe,
              firstFaultDetail: parsed.data.firstFaultDetail,
            }
          : undefined);

      await tx.pointLog.create({
        data: {
          matchId: match.id,
          winnerId: parsed.data.winnerId,
          type: parsed.data.type,
          serverId: parsed.data.serverId,
          annotations,
        },
      });

      return newState;
    });

    if (result) {
      emitMatchEvent(id, 'point_scored', result);
    }

    return NextResponse.json({ scoreState: result });
  } catch (error) {
    if (error instanceof TransactionError) {
      return NextResponse.json(
        { error: error.code, message: error.message, ...(error.extra ?? {}) },
        { status: error.status }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'VERSION_CONFLICT',
          message: 'Conflito de concorrência: outro anotador registrou um ponto antes. Recarregue e tente novamente.',
        },
        { status: 409 }
      );
    }
    console.error('[MATCH POINT]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

class TransactionError extends Error {
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
