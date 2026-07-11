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
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[POINT] Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'INVALID_BODY', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'INVALID_BODY', message: 'Request body is required' },
        { status: 400 }
      );
    }
    
    console.log('[POINT REQUEST] Received payload:', JSON.stringify(body, null, 2));
    
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
        console.error('[POINT] Match not found:', id);
        throw new TransactionError('Partida não encontrada', 404, 'MATCH_NOT_FOUND');
      }

      if (match.state !== 'IN_PROGRESS') {
        console.error('[POINT] Match not in progress:', match.state);
        throw new TransactionError('Partida não está em andamento', 422, 'MATCH_NOT_IN_PROGRESS');
      }

      if (!match.initialServerId) {
        console.error('[POINT] No initial server set');
        throw new TransactionError('Defina o primeiro sacador antes de pontuar', 422, 'MATCH_NOT_STARTED');
      }

      if (parsed.data.sequenceNumber) {
        const pointLogCount = await tx.pointLog.count({ where: { matchId: id } });
        if (parsed.data.sequenceNumber !== pointLogCount + 1) {
          console.error('[POINT] Sequence conflict:', {
            expected: pointLogCount + 1,
            received: parsed.data.sequenceNumber,
          });
          throw new TransactionError(
            `Conflito de sequência: esperado ${pointLogCount + 1}, recebido ${parsed.data.sequenceNumber}`,
            409,
            'SEQUENCE_CONFLICT',
            { expectedSequence: pointLogCount + 1 }
          );
        }
      }

      console.log('[POINT] Creating engine from match state');
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

      console.log('[POINT] Applying point:', parsed.data);
      const newState = engine.applyPoint(parsed.data);

      const isMatchFinished = newState.isFinished;

      console.log('[POINT] Updating match:', {
        version: match.version,
        isFinished: isMatchFinished,
      });
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

      console.log('[POINT] Creating point log:', {
        winnerId: parsed.data.winnerId,
        type: parsed.data.type,
        rallyLength: parsed.data.rallyLength,
      });
      await tx.pointLog.create({
        data: {
          matchId: match.id,
          winnerId: parsed.data.winnerId,
          type: parsed.data.type,
          serverId: parsed.data.serverId,
          annotations,
        },
      });

      console.log('[POINT] Transaction completed successfully');
      return newState;
    }, {
      timeout: 30000,
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
