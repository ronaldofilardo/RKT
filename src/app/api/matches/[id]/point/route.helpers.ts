import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ScoringEngine } from '@/core/scoring/engine';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import { logger } from '@/lib/logger';
import type { PointFlowInput } from '@/schemas/contracts';

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

export async function validateMatchAnnotatorPermission(
  match: {
    player1Id: string;
    player2Id: string;
    createdByUserId?: string | null;
    openForAnnotation?: boolean | null;
  },
  id: string,
  currentUserId?: string,
  currentUserRole?: string,
  tx?: any,
): Promise<void> {
  const isPrivilegedStaff = currentUserRole === 'ADMIN' || currentUserRole === 'GESTOR';
  const isPlayer =
    match.player1Id === currentUserId ||
    match.player2Id === currentUserId ||
    match.createdByUserId === currentUserId;

  if (isPrivilegedStaff || isPlayer || match.openForAnnotation === true) {
    return;
  }

  const hasSessionModel = typeof tx?.matchAnnotationSession?.findFirst === 'function';
  const activeSession = hasSessionModel
    ? await tx.matchAnnotationSession.findFirst({
        where: { matchId: id, isActive: true, annotatorUserId: currentUserId },
      })
    : null;

  if (hasSessionModel && !activeSession) {
    throw new TransactionError(
      'Apenas os jogadores, equipe técnica ou o anotador da sessão ativa podem registrar pontos',
      403,
      'FORBIDDEN',
    );
  }
}

export function restoreEngineFromMatch(match: {
  format: string;
  player1Id: string;
  player2Id: string;
  initialServerId: string;
  scoreState: unknown;
}): ScoringEngine {
  let scoreStateToUse = match.scoreState;
  if (scoreStateToUse && typeof scoreStateToUse === 'object') {
    const normalized = normalizeScoreState(scoreStateToUse, match.format as any);
    if (normalized) {
      scoreStateToUse = normalized as any;
    }
  }

  if (scoreStateToUse && typeof scoreStateToUse === 'object') {
    const ss = scoreStateToUse as any;
    const innerState = ss.state ?? ss;
    if (innerState?.isFinished === true) {
      logger.point.matchAlreadyFinished(innerState?.winner);
      throw new TransactionError('Partida já finalizada', 422, 'MATCH_ALREADY_FINISHED');
    }
  }

  const engineConfig = {
    format: match.format as any,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    initialServerId: match.initialServerId,
  };

  return scoreStateToUse
    ? ScoringEngine.fromSerialized(engineConfig, JSON.stringify(scoreStateToUse))
    : new ScoringEngine(engineConfig);
}

export function buildAnnotationsPayload(data: PointFlowInput) {
  if (data.annotations) return data.annotations;
  if (!data.rallyDetails) return undefined;

  return {
    rallyDetails: data.rallyDetails,
    rallyLength: data.rallyLength,
    isFirstServe: data.isFirstServe,
    isSecondServe: data.isSecondServe,
    firstFaultDetail: data.firstFaultDetail,
    note: data.rallyDetails.note,
  };
}

export async function handlePointRouteError(
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
