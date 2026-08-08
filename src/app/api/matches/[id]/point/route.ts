import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PointFlowInputSchema } from '@/schemas/contracts';
import { withRLSHandler } from '@/lib/auth';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringState } from '@/core/scoring/types';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id } = await params;

      let body;
      try {
        body = await request.json();
      } catch (e) {
        logger.point.parseError(e);
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

      logger.point.received(body);

      const parsed = PointFlowInputSchema.safeParse(body);

      if (!parsed.success) {
        logger.point.validationError({
          body,
          issues: parsed.error.issues,
          flattened: parsed.error.flatten(),
        });
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const result: { scoreState: ScoringState; version: number } | null = await prisma.$transaction(async (tx) => {
        const match = await tx.match.findFirst({
          where: { id },
          include: { player1: true, player2: true },
        });

        if (!match) {
          logger.point.matchNotFound(id);
          throw new TransactionError('Partida não encontrada', 404, 'MATCH_NOT_FOUND');
        }

        if (match.state !== 'IN_PROGRESS') {
          logger.point.matchNotInProgress(match.state);
          throw new TransactionError('Partida não está em andamento', 422, 'MATCH_NOT_IN_PROGRESS');
        }

        if (!match.initialServerId) {
          logger.point.noInitialServer();
          throw new TransactionError('Defina o primeiro sacador antes de pontuar', 422, 'MATCH_NOT_STARTED');
        }

        if (parsed.data.sequenceNumber) {
          const pointLogCount = await tx.pointLog.count({ where: { matchId: id } });
          if (parsed.data.sequenceNumber !== pointLogCount + 1) {
            logger.point.sequenceConflict({
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

        const expectedVersion = match.version;
        const nextVersion = match.version + 1;

        logger.point.engineCreated();

        let scoreStateToUse = match.scoreState;
        if (scoreStateToUse && typeof scoreStateToUse === 'object') {
          const isMatchTiebreakFormat = match.format === 'MATCH_TB_10' || match.format === 'BEST_OF_3_MATCH_TB';
          if (isMatchTiebreakFormat && (scoreStateToUse as any).sets?.length >= 1) {
            const setIndex = match.format === 'MATCH_TB_10' ? 0 : (scoreStateToUse as any).sets.length - 1;
            const set = (scoreStateToUse as any).sets[setIndex];

            if (set && (set.player1 > 0 || set.player2 > 0) && !set.isTiebreak && !set.tiebreakScore) {
              logger.point.normalizedTiebreak();
              (scoreStateToUse as any).sets[setIndex] = {
                ...set,
                tiebreakScore: { player1: set.player1, player2: set.player2 },
                player1: 0,
                player2: 0,
                isTiebreak: true,
              };
            }
          }
        }

        const engine = scoreStateToUse
          ? ScoringEngine.fromSerialized(
              {
                format: match.format as any,
                player1Id: match.player1Id,
                player2Id: match.player2Id,
                initialServerId: match.initialServerId,
              },
              JSON.stringify(scoreStateToUse)
            )
          : new ScoringEngine({
              format: match.format as any,
              player1Id: match.player1Id,
              player2Id: match.player2Id,
              initialServerId: match.initialServerId,
            });

        logger.point.applying(parsed.data);
        const newState = engine.applyPoint(parsed.data);

        const isMatchFinished = newState.isFinished;

        const snapshot = JSON.parse(engine.serialize()) as {
          state: ScoringState;
          history: unknown[];
        };

        logger.point.updatingMatch({ version: match.version, isFinished: isMatchFinished });
        await tx.match.update({
          where: { id, version: expectedVersion },
          data: {
            scoreState: snapshot as any,
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
                note: parsed.data.rallyDetails.note,
              }
            : undefined);

        logger.point.creatingPointLog({
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

        logger.point.transactionCompleted();
        logger.point.newStateSets(newState.sets);
        return { scoreState: newState, version: nextVersion };
      });

      if (result?.scoreState) {
        emitMatchEvent(id, 'point_scored', result.scoreState);
      }

      return NextResponse.json({
        scoreState: result?.scoreState,
        version: result?.version,
      });
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
      logger.point.api.error(error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
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
