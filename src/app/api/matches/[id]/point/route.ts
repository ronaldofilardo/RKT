import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PointFlowInputSchema } from '@/schemas/contracts';
import { withRLSHandler } from '@/lib/auth';
import type { ScoringState, TennisFormat } from '@/core/scoring/types';
import { emitMatchEvent } from '@/lib/match-events';
import { logger } from '@/lib/logger';
import { ScoreEnvelopeSchema } from '@/schemas/score';
import { Prisma } from '@prisma/client';
import {
  TransactionError,
  restoreEngineFromMatch,
  buildAnnotationsPayload,
  reportPointRouteFailure,
} from './route.logic';
import { loadMatchForPoint, type PointTransactionResult } from './route-load.logic';
import { resolveNextSequence } from './route-sequence.logic';
import {
  getServingMemberId,
  courtSide,
  getReceiverMemberId,
  sideOfPlayer,
  isNoAdDecidingPoint,
} from '@/core/scoring/doubles';
import { buildEngineConfig } from '@/core/scoring/engine-config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async (user) => {
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

      const result: PointTransactionResult | null = await prisma.$transaction(async (tx) => {
        const loaded = await loadMatchForPoint(
          tx,
          id,
          parsed.data.clientEventId,
          user?.id,
          user?.role,
        );
        if (loaded.kind === 'existing') return loaded.result;
        const match = loaded.match;

        logger.point.engineCreated();
        const engine = restoreEngineFromMatch(match as Parameters<typeof restoreEngineFromMatch>[0]);
        const prePointState = engine.getState();
        const isDoubles = match.matchType === 'DOUBLES';
        const engineConfig = buildEngineConfig(match);

        let finalServerId = parsed.data.serverId;
        let calculatedReceiverId = parsed.data.receiverId;
        let calculatedCourtSide = parsed.data.courtSide;
        let finalHitterId = parsed.data.hitterId;

        if (isDoubles) {
          if (!engineConfig.doubles) {
            throw new TransactionError('Configuração de duplas ausente na partida', 400, 'DOUBLES_CONFIG_MISSING');
          }

          const serverMemberId = getServingMemberId(prePointState, engineConfig.doubles);
          calculatedCourtSide = courtSide(prePointState);
          calculatedReceiverId = getReceiverMemberId(prePointState, engineConfig.doubles, parsed.data.receiverId);

          if (parsed.data.serverId && parsed.data.serverId !== serverMemberId) {
            logger.warn({
              message: '[POST /point doubles] client serverId diverged from server calculation, using server value',
              clientServerId: parsed.data.serverId,
              calculatedServerId: serverMemberId,
              matchId: id,
            });
          }
          finalServerId = serverMemberId;

          const allMembers = [
            match.player1Id,
            match.player1PartnerId,
            match.player2Id,
            match.player2PartnerId,
          ].filter(Boolean) as string[];

          const winnerSide = sideOfPlayer(engineConfig.doubles, parsed.data.winnerId);
          if (!winnerSide) {
            throw new TransactionError('Jogador vencedor inválido para esta partida', 400, 'INVALID_WINNER');
          }

          const serverSide = prePointState.server;
          if (parsed.data.type === 'DOUBLE_FAULT' && winnerSide === serverSide) {
            throw new TransactionError(
              'Em um double fault, o vencedor do ponto deve ser o receptor, não o sacador',
              400,
              'DF_WINNER_MUST_BE_RECEIVER'
            );
          }

          if (parsed.data.type === 'ACE' && winnerSide !== serverSide) {
            throw new TransactionError(
              'Em um ace, o vencedor do ponto deve ser o sacador',
              400,
              'ACE_WINNER_MUST_BE_SERVER'
            );
          }

          if (parsed.data.hitterId && !allMembers.includes(parsed.data.hitterId)) {
            throw new TransactionError('hitterId deve ser um dos atletas da partida', 400, 'INVALID_HITTER');
          }

          if (parsed.data.type === 'ACE' || parsed.data.type === 'DOUBLE_FAULT') {
            finalHitterId = finalServerId;
          }

          if (parsed.data.receiverId) {
            if (isNoAdDecidingPoint(prePointState, match.format as TennisFormat)) {
              const receivingSide = serverSide === 'player1' ? 'player2' : 'player1';
              const receivingMembers = engineConfig.doubles.members[receivingSide];
              if (!receivingMembers.includes(parsed.data.receiverId)) {
                throw new TransactionError('receiverId deve pertencer à dupla recebedora', 400, 'INVALID_RECEIVER');
              }
            }
          }
        } else {
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

          // Modo Sombra (D5): auditar se parsed.data.serverId coincide com o engine restaurado sem bloquear
          const expectedEngineServer = typeof engine.getServer === 'function'
            ? engine.getServer()
            : (typeof engine.getState === 'function' ? engine.getState().server : undefined);
          const expectedServerId = expectedEngineServer === 'player1'
            ? match.player1Id
            : expectedEngineServer === 'player2'
            ? match.player2Id
            : undefined;

          if (parsed.data.serverId && expectedServerId && parsed.data.serverId !== expectedServerId) {
            logger.warn({
              message: '[POST /point shadow-mode] serverId mismatch',
              matchId: id,
              receivedServerId: parsed.data.serverId,
              expectedServerId,
              engineServer: expectedEngineServer,
              sequenceNumber: parsed.data.sequenceNumber,
            });
          }
        }

        const nextSequenceNumber = await resolveNextSequence(tx, id, parsed.data.sequenceNumber);

        const expectedVersion = match.version;
        const nextVersion = match.version + 1;

        logger.point.applying(parsed.data);
        let newState: ScoringState;
        try {
          const flowToApply = {
            ...parsed.data,
            serverId: finalServerId,
            ...(calculatedReceiverId !== undefined ? { receiverId: calculatedReceiverId } : {}),
            ...(calculatedCourtSide !== undefined ? { courtSide: calculatedCourtSide } : {}),
            ...(finalHitterId !== undefined ? { hitterId: finalHitterId } : {}),
          };
          newState = engine.applyPoint(flowToApply);
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
        // Performance fix: persiste snapshot enxuto { state: newState, history: [] } no caminho quente,
        // eliminando o custo quadrático de serializar e persistir histórico acumulado a cada ponto.
        const snapshot = {
          state: newState,
          history: [],
        };

        const envelopeParsed = ScoreEnvelopeSchema.safeParse(snapshot);
        if (!envelopeParsed.success) {
          logger.warn({
            message: "ScoreEnvelope format anomaly detected",
            matchId: id,
            issues: envelopeParsed.error.issues,
          });
        }

        logger.point.updatingMatch({ version: match.version, isFinished: isMatchFinished });
        const finishData = isMatchFinished
          ? {
              state: 'FINISHED' as const,
              finishedAt: new Date(),
              winnerId: newState.winner === 'player1' ? match.player1Id : match.player2Id,
            }
          : {};

        const startedAtData = !match.startedAt
          ? { startedAt: new Date(newState.startedAt ?? Date.now()) }
          : {};

        await tx.match.update({
          where: { id, version: expectedVersion },
          data: {
            scoreState: snapshot as unknown as Prisma.InputJsonValue,
            version: { increment: 1 },
            ...finishData,
            ...startedAtData,
          },
        });

        const annotations = buildAnnotationsPayload(parsed.data, {
          hitterId: finalHitterId,
          receiverId: calculatedReceiverId,
          courtSide: calculatedCourtSide,
        });

        logger.point.creatingPointLog({
          winnerId: parsed.data.winnerId,
          type: parsed.data.type,
          rallyLength: parsed.data.rallyLength,
        });

        const nowMs = Date.now();
        let validatedTimestamp: Date;

        if (parsed.data.timestamp) {
          const clientMs = typeof parsed.data.timestamp === 'number'
            ? parsed.data.timestamp
            : new Date(parsed.data.timestamp).getTime();

          const maxAllowedFuture = nowMs + 5 * 60 * 1000;
          const matchStartMs = match.startedAt ? new Date(match.startedAt).getTime() : match.createdAt.getTime();
          const minAllowedPast = matchStartMs - 60 * 60 * 1000;

          if (clientMs > maxAllowedFuture) {
            logger.warn({
              message: '[POST /point] client timestamp in future clamped to now',
              clientMs,
              nowMs,
            });
            validatedTimestamp = new Date(nowMs);
          } else if (clientMs < minAllowedPast) {
            logger.warn({
              message: '[POST /point] client timestamp too far in past clamped to match start',
              clientMs,
              matchStartMs,
            });
            validatedTimestamp = new Date(matchStartMs);
          } else {
            validatedTimestamp = new Date(clientMs);
          }
        } else {
          validatedTimestamp = new Date(nowMs);
        }

        const pointLog = await tx.pointLog.create({
          data: {
            matchId: match.id,
            winnerId: parsed.data.winnerId,
            type: parsed.data.type,
            serverId: finalServerId,
            timestamp: validatedTimestamp,
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
      return reportPointRouteFailure(error, requestId, requestClientEventId);
    }
  });
}
