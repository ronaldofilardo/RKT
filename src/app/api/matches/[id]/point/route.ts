import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PointFlowInputSchema } from '@/schemas/contracts';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import type { ScoringState } from '@/core/scoring/types';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';
import {
  TransactionError,
  validateMatchAnnotatorPermission,
  restoreEngineFromMatch,
  buildAnnotationsPayload,
  handlePointRouteError,
} from './route.helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    let requestId = '';
    let requestClientEventId: string | undefined;
    try {
      const { id } = await params;
      requestId = id;

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

      requestClientEventId = parsed.data.clientEventId;

      const result: { scoreState: ScoringState; version: number; pointLogId: string } | null = await prisma.$transaction(async (tx) => {
        const match = await tx.match.findFirst({
          where: { id },
          include: { player1: true, player2: true },
        });

        if (!match) {
          logger.point.matchNotFound(id);
          throw new TransactionError('Partida não encontrada', 404, 'MATCH_NOT_FOUND');
        }

        const currentUser = getRLSUser();
        await validateMatchAnnotatorPermission(match, id, currentUser?.id, currentUser?.role, tx);

        if (parsed.data.clientEventId) {
          const existingPoint = await tx.pointLog.findFirst({
            where: { matchId: id, clientEventId: parsed.data.clientEventId },
            select: { id: true },
          });
          if (existingPoint) {
            return {
              scoreState: match.scoreState as unknown as ScoringState,
              version: match.version,
              pointLogId: existingPoint.id,
            };
          }
        }

        if (match.state !== 'IN_PROGRESS') {
          logger.point.matchNotInProgress(match.state);
          throw new TransactionError('Partida não está em andamento', 422, 'MATCH_NOT_IN_PROGRESS');
        }

        if (!match.initialServerId) {
          logger.point.noInitialServer();
          throw new TransactionError('Defina o primeiro sacador antes de pontuar', 422, 'MATCH_NOT_STARTED');
        }

        if (parsed.data.type === 'DOUBLE_FAULT' && parsed.data.winnerId === parsed.data.serverId) {
          throw new TransactionError(
            'Em um double fault, o vencedor do ponto deve ser o receptor, não o sacador',
            400,
            'DF_WINNER_MUST_BE_RECEIVER'
          );
        }

        if (parsed.data.type === 'ACE' && parsed.data.winnerId !== parsed.data.serverId) {
          throw new TransactionError(
            'Em um ace, o vencedor do ponto deve ser o sacador',
            400,
            'ACE_WINNER_MUST_BE_SERVER'
          );
        }

        if (typeof tx.pointLog.updateMany === 'function') {
          await tx.pointLog.updateMany({
            where: { matchId: id, voidedAt: { not: null }, sequenceNumber: { not: null } },
            data: { sequenceNumber: null },
          });
        }

        // P2-12 FIX: Usar MAX(sequenceNumber) + 1 em vez de count + 1
        // para evitar conflito de unique constraint após anulação de pontos.
        const maxRow = await tx.pointLog.aggregate({
          where: { matchId: id, voidedAt: null, sequenceNumber: { not: null } },
          _max: { sequenceNumber: true },
        });
        const nextSequenceNumber = (maxRow._max.sequenceNumber ?? 0) + 1;

        if (parsed.data.sequenceNumber !== undefined && parsed.data.sequenceNumber !== nextSequenceNumber) {
          logger.point.sequenceConflict({
            expected: nextSequenceNumber,
            received: parsed.data.sequenceNumber,
          });
          throw new TransactionError(
            `Conflito de sequência: esperado ${nextSequenceNumber}, recebido ${parsed.data.sequenceNumber}`,
            409,
            'SEQUENCE_CONFLICT',
            { expectedSequence: nextSequenceNumber }
          );
        }

        const expectedVersion = match.version;
        const nextVersion = match.version + 1;

        logger.point.engineCreated();
        const engine = restoreEngineFromMatch(match as any);

        logger.point.applying(parsed.data);
        let newState: ScoringState;
        try {
          newState = engine.applyPoint(parsed.data);
        } catch (engineError) {
          const msg = engineError instanceof Error ? engineError.message : String(engineError);
          if (msg === 'MATCH_ALREADY_FINISHED') {
            throw new TransactionError('Partida já finalizada', 422, 'MATCH_ALREADY_FINISHED');
          }
          if (msg === 'INVALID_WINNER') {
            throw new TransactionError('Jogador vencedor inválido para esta partida', 400, 'INVALID_WINNER');
          }
          throw engineError;
        }

        const isMatchFinished = newState.isFinished;
        const snapshot = JSON.parse(engine.serialize()) as {
          state: ScoringState;
          history: unknown[];
        };

        logger.point.updatingMatch({ version: match.version, isFinished: isMatchFinished });
        const finishData = isMatchFinished
          ? {
              state: 'FINISHED' as const,
              finishedAt: new Date(),
              winnerId: newState.winner === 'player1' ? match.player1Id : match.player2Id,
            }
          : {};

        await tx.match.update({
          where: { id, version: expectedVersion },
          data: {
            scoreState: snapshot as any,
            version: { increment: 1 },
            ...finishData,
          },
        });

        const annotations = buildAnnotationsPayload(parsed.data);

        logger.point.creatingPointLog({
          winnerId: parsed.data.winnerId,
          type: parsed.data.type,
          rallyLength: parsed.data.rallyLength,
        });

        const pointLog = await tx.pointLog.create({
          data: {
            matchId: match.id,
            winnerId: parsed.data.winnerId,
            type: parsed.data.type,
            serverId: parsed.data.serverId,
            annotations,
            sequenceNumber: nextSequenceNumber,
            clientEventId: parsed.data.clientEventId,
          },
        });

        logger.point.transactionCompleted();
        logger.point.newStateSets(newState.sets);
        return { scoreState: newState, version: nextVersion, pointLogId: pointLog.id };
      });

      if (result?.scoreState) {
        emitMatchEvent(id, 'point_scored', result.scoreState);
      }

      return NextResponse.json({
        scoreState: result?.scoreState,
        version: result?.version,
        pointLogId: result?.pointLogId,
      });
    } catch (error) {
      return handlePointRouteError(error, requestId, requestClientEventId);
    }
  });
}
