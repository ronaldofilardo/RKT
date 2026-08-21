import { prisma } from "@/lib/prisma";
import type {

  MatchState,
  CreateMatchInput,
  MatchFinishReason,
} from "@/schemas/contracts";
import { listMatches, getMatch, findAbandonedSessionSnapshot } from "./matchRepository";
import { validateFinishMatch, validateTransitionState } from "./matchValidator";

import {
  buildCreateMatchData,
  validateCreateMatchPlayers,
  warnMissingCreator,
  type MatchTransactionClient,
} from './matchService.create.helpers';
import {
  buildFinishUpdateData,
  buildMatchUpdateData,
  sanitizeMatchUpdate,
} from './matchService.operations.helpers';

export { listMatches, getMatch, findAbandonedSessionSnapshot };

export async function createMatch(
  data: CreateMatchInput,
  createdByUserId?: string,
  tx?: MatchTransactionClient,
) {
  validateCreateMatchPlayers(data);
  warnMissingCreator(createdByUserId);
  const client = tx ?? prisma;
  return client.match.create({
    data: buildCreateMatchData(data, createdByUserId),
    include: { player1: true, player2: true },
  });
}

export async function updateMatch(id: string, data: Record<string, unknown>) {
  const match = await prisma.match.findFirst({ where: { id } });
  if (!match) return null;

  const sanitized = sanitizeMatchUpdate(data);
  return prisma.match.update({
    where: { id },
    data: buildMatchUpdateData(sanitized),
    include: { player1: true, player2: true },
  });
}

export async function deleteMatch(
  id: string,
  options: {
    type: 'soft' | 'hard';
    reason?: string;
    deletedBy?: string;
  }
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: {
      pointLog: { select: { id: true } },
      annotationSessions: { select: { id: true } },
    },
  });

  if (!match) return { error: 'MATCH_NOT_FOUND' } as const;

  if (match.state === 'FINISHED') {
    return {
      error: 'CANNOT_DELETE_FINISHED: Partidas finalizadas não podem ser excluídas permanentemente',
    } as const;
  }

  if (options.type === 'hard') {
    await prisma.$transaction([
      prisma.pointLog.deleteMany({ where: { matchId: id } }),
      prisma.matchAnnotationSession.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } }),
    ]);
    return {
      success: true,
      type: 'hard',
      stats: {
        points: match.pointLog.length,
        annotationSessions: match.annotationSessions.length,
      },
    } as const;
  }

  const updateData: Record<string, unknown> = {
    state: 'CANCELLED',
    deletedAt: new Date(),
  };
  if (options.deletedBy) {
    updateData.deletedBy = options.deletedBy;
  }
  if (options.reason) {
    updateData.finishNote = options.reason;
  }

  await prisma.match.update({
    where: { id },
    data: updateData,
  });

  return {
    success: true,
    type: 'soft',
    stats: {
      points: match.pointLog.length,
      annotationSessions: match.annotationSessions.length,
    },
  } as const;
}

export async function finishMatch(
  id: string,
  scoreState: unknown,
  options?: {
    reason?: MatchFinishReason;
    note?: string;
    winnerId?: string;
  }
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: { player1: true, player2: true },
  });

  if (!match) return { error: 'MATCH_NOT_FOUND' } as const;

  const validation = validateFinishMatch(
    {
      format: match.format as any,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      initialServerId: match.initialServerId,
      scoreState: match.scoreState,
      state: match.state,
    },
    scoreState,
    options?.reason,
  );

  if (!validation.valid) {
    return { error: validation.error } as const;
  }

  const updateData = buildFinishUpdateData(
    scoreState,
    match.scoreState,
    options?.reason,
    options?.note,
    options?.winnerId,
  );

  return prisma.match.update({
    where: { id },
    data: updateData,
    include: { player1: true, player2: true },
  });
}

export async function transitionMatchState(
  id: string,
  newState: MatchState,
  initialServerId?: string,
  scoreState?: unknown,
  options?: {
    allowScoreEdit?: boolean;
    expectedVersion?: number;
    /**
     * true quando esta atualização vem do fluxo "Editar Placar" (retomada
     * de partida interrompida), não de um `undo` comum. Aciona a gravação
     * do segmento anterior em `MatchScoreEdit` antes de sobrescrever
     * `match.scoreState`, para que o `/report` consiga reconstruir a
     * timeline completa (com marcador de interrupção) em vez de perder o
     * trecho já anotado antes da correção.
     */
    isManualScoreEdit?: boolean;
    editedByUserId?: string;
  },
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: { player1: true, player2: true },
  });
  if (!match) return null;

  const validation = validateTransitionState(
    {
      format: match.format as any,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      initialServerId: match.initialServerId,
      scoreState: match.scoreState,
      state: match.state,
    },
    newState,
    scoreState,
    options,
  );

  if (!validation.valid) {
    return { error: validation.error } as const;
  }

  const expectedVersion = options?.expectedVersion;
  const whereClause: { id: string; version?: number } = { id };
  if (expectedVersion !== undefined) {
    whereClause.version = expectedVersion;
  }

  // Uma edição manual de placar só gera um "segmento fechado" quando existe
  // de fato um scoreState anterior com conteúdo a preservar (senão não há
  // nada de útil a registrar — ex.: primeira definição de placar ao
  // configurar a partida).
  const shouldRecordSegment =
    Boolean(options?.isManualScoreEdit) &&
    Boolean(scoreState) &&
    match.scoreState !== null &&
    match.scoreState !== undefined;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (shouldRecordSegment) {
        await tx.matchScoreEdit.create({
          data: {
            matchId: id,
            editedByUserId: options?.editedByUserId,
            previousScoreState: match.scoreState as any,
            newScoreState: scoreState as any,
          },
        });
      }

      return tx.match.update({
        where: whereClause,
        data: {
          state: newState,
          ...(newState === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
          ...(newState === "FINISHED" ? { finishedAt: new Date() } : {}),
          ...(initialServerId ? { initialServerId } : {}),
          ...(scoreState ? { scoreState: scoreState as any } : {}),
          version: { increment: 1 },
        },
        include: { player1: true, player2: true },
      });
    });
    return updated;
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return { error: 'VERSION_CONFLICT' } as const;
    }
    throw error;
  }
}

/**
 * Lista os segmentos de edição de placar de uma partida, em ordem
 * cronológica. Usado pelo `/report` para reconstruir a timeline completa
 * (um segmento por trecho de anotação, separado por marcadores de
 * interrupção) e, futuramente, pelo módulo de estatísticas.
 */
export async function getMatchScoreEdits(matchId: string) {
  return prisma.matchScoreEdit.findMany({
    where: { matchId },
    orderBy: { editedAt: "asc" },
    select: {
      id: true,
      editedAt: true,
      editedByUserId: true,
      previousScoreState: true,
      newScoreState: true,
      note: true,
    },
  });
}