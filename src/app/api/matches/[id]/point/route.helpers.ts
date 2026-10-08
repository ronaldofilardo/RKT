import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ScoringEngine } from '@/core/scoring/engine';
import { normalizeScoreState, extractHistory } from '@/core/scoring/score-normalizer';
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
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const isPrivilegedStaff = currentUserRole === 'ADMIN';
  const isPlayer =
    match.player1Id === currentUserId ||
    match.player2Id === currentUserId ||
    match.createdByUserId === currentUserId;

  if (isPrivilegedStaff || isPlayer || match.openForAnnotation === true) {
    return;
  }

  const hasSessionModel = typeof (tx as any)?.matchAnnotationSession?.findFirst === 'function';
  const activeSession = hasSessionModel
    ? await (tx as any).matchAnnotationSession.findFirst({
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
    const normalized = normalizeScoreState(scoreStateToUse, match.format as Parameters<typeof normalizeScoreState>[1]);
    if (normalized) {
      scoreStateToUse = normalized;
    }
  }

  if (scoreStateToUse && typeof scoreStateToUse === 'object') {
    const ss = scoreStateToUse as Record<string, unknown>;
    const innerState = (ss.state ?? ss) as Record<string, unknown>;
    if (innerState?.isFinished === true) {
      logger.point.matchAlreadyFinished(innerState?.winner);
      throw new TransactionError('Partida já finalizada', 422, 'MATCH_ALREADY_FINISHED');
    }
  }

  const engineConfig = {
    format: match.format as NonNullable<Parameters<typeof ScoringEngine.fromSerialized>[0]['format']>,
    player1Id: match.player1Id,
    player2Id: match.player2Id,
    initialServerId: match.initialServerId,
  };

  const engine = scoreStateToUse
    ? ScoringEngine.fromSerialized(engineConfig, JSON.stringify(scoreStateToUse))
    : new ScoringEngine(engineConfig);

  // BUG FIX (2026-09-27) — CRÍTICO: normalizeScoreState() sempre retorna só
  // o `state` saneado, nunca o `history` — mesmo quando match.scoreState já
  // era o envelope completo {state, history}. Como esta função constrói o
  // engine usado em TODA transação real de ponto (POST /point, via
  // route.ts), o engine sempre nascia com histórico VAZIO; applyPoint()
  // então salvava só o ponto ATUAL nesse histórico, e essa versão de 1
  // único ponto era persistida de volta em match.scoreState (snapshot =
  // engine.serialize()). Resultado: o `history` gravado no banco nunca
  // acumulava mais de 1 ponto por vez. Isso não corrompe o placar (que
  // depende só do `state`), mas corrompe qualquer leitura futura do
  // histórico completo a partir do scoreState persistido — em particular,
  // a timeline ao vivo em /scoring (engineRef.current.getPointHistory() no
  // cliente) podia reidratar com só 1 ponto sempre que um fetchMatch(true)
  // recarregava o engine a partir do servidor. Corrigido restaurando o
  // histórico original (extraído do match.scoreState ANTES da
  // normalização) sobre o estado saneado.
  if (engine.getHistoryLength() === 0) {
    const originalHistory = extractHistory(match.scoreState);
    if (originalHistory && originalHistory.length > 0) {
      engine.restorePointHistory(originalHistory);
    }
  }

  return engine;
}

export function buildAnnotationsPayload(data: PointFlowInput) {
  const hasFirstFaultDetail = Boolean(
    data.firstFaultDetail &&
      (data.firstFaultDetail.errorType ||
        data.firstFaultDetail.serveEffect ||
        data.firstFaultDetail.direction ||
        Object.keys(data.firstFaultDetail).length > 0)
  ) || Boolean(
    data.annotations?.firstFaultDetail &&
      (data.annotations.firstFaultDetail.errorType ||
        data.annotations.firstFaultDetail.serveEffect ||
        data.annotations.firstFaultDetail.direction ||
        Object.keys(data.annotations.firstFaultDetail).length > 0)
  );

  const isExplicitSecondServe =
    data.type === 'DOUBLE_FAULT' ||
    hasFirstFaultDetail ||
    data.isSecondServe === true ||
    data.annotations?.isSecondServe === true ||
    data.isFirstServe === false ||
    data.annotations?.isFirstServe === false;

  const isSecondServe = isExplicitSecondServe;
  const isFirstServe = !isSecondServe;

  const firstFaultDetail =
    data.firstFaultDetail ??
    data.annotations?.firstFaultDetail ??
    undefined;

  const rallyDetails =
    data.rallyDetails ??
    data.annotations?.rallyDetails ??
    undefined;

  const rallyLength =
    data.rallyLength ??
    data.annotations?.rallyLength ??
    undefined;

  const note =
    data.annotations?.note ??
    rallyDetails?.note ??
    undefined;

  const zone = data.annotations?.zone;
  const stroke = data.annotations?.stroke;

  return {
    ...(data.annotations ?? {}),
    isFirstServe,
    isSecondServe,
    ...(firstFaultDetail !== undefined ? { firstFaultDetail } : {}),
    ...(rallyDetails !== undefined ? { rallyDetails } : {}),
    ...(rallyLength !== undefined ? { rallyLength } : {}),
    ...(note !== undefined ? { note } : {}),
    ...(zone !== undefined ? { zone } : {}),
    ...(stroke !== undefined ? { stroke } : {}),
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
