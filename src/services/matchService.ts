import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import type {
  MatchFormat,
  MatchState,
  CreateMatchInput,
  MatchFinishReason,
} from "@/schemas/contracts";
import { listMatches, getMatch, findAbandonedSessionSnapshot } from "./matchRepository";
import { validateFinishMatch, validateTransitionState } from "./matchValidator";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export { listMatches, getMatch, findAbandonedSessionSnapshot };

export async function createMatch(data: CreateMatchInput, createdByUserId?: string, tx?: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) {
  const {
    player1Id,
    player2Id,
    format,
    sportType,
    courtType,
    scheduledAt,
    initialServerId,
    nickname,
    visibility,
    openForAnnotation,
    tournamentName,
    category,
    round,
    roundName,
    bracketType,
    temperature,
    humidity,
  } = data;

  if (player1Id === player2Id) {
    throw new ValidationError({
      player2Id: ["Jogador 2 deve ser diferente do Jogador 1"],
    });
  }

  if (!createdByUserId) {
    logger.warn(
      "[createMatch] createdByUserId ausente — partida será criada sem auditoria de autor (TD-045)",
    );
  }

  const client = tx ?? prisma;
  return client.match.create({
    data: {
      format: format as MatchFormat,
      sportType: sportType || "TENNIS",
      courtType: courtType || null,
      nickname: nickname || null,
      visibility: visibility || "PUBLIC",
      openForAnnotation: openForAnnotation || false,
      tournamentName: tournamentName || null,
      category: category || null,
      round: round || roundName || null,
      bracketType: bracketType || null,
      temperature: temperature || null,
      humidity: humidity || null,
      state: "SCHEDULED",
      player1Id,
      player2Id,
      ...(initialServerId ? { initialServerId } : {}),
      scheduledAt: scheduledAt || null,
      ...(createdByUserId ? { createdByUserId } : {}),
    },
    include: { player1: true, player2: true },
  });
}

export async function updateMatch(id: string, data: Record<string, unknown>) {
  const match = await prisma.match.findFirst({ where: { id } });
  if (!match) return null;

  const ALLOWED_FIELDS = [
    'nickname',
    'sportType',
    'courtType',
    'visibility',
    'openForAnnotation',
    'scheduledAt',
    'initialServerId',
    'tournamentName',
    'category',
    'roundName',
    'bracketType',
    'temperature',
    'humidity',
  ] as const;
  type AllowedField = (typeof ALLOWED_FIELDS)[number];

  const sanitized: Partial<Record<AllowedField, unknown>> = {};
  for (const key of ALLOWED_FIELDS) {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }

  return prisma.match.update({
    where: { id },
    data: {
      ...(sanitized.nickname !== undefined
        ? { nickname: sanitized.nickname as string }
        : {}),
      ...(sanitized.sportType !== undefined
        ? { sportType: sanitized.sportType as string }
        : {}),
      ...(sanitized.courtType !== undefined
        ? { courtType: sanitized.courtType as string | null }
        : {}),
      ...(sanitized.visibility !== undefined
        ? { visibility: sanitized.visibility as string }
        : {}),
      ...(sanitized.openForAnnotation !== undefined
        ? { openForAnnotation: sanitized.openForAnnotation as boolean }
        : {}),
      ...(sanitized.scheduledAt !== undefined
        ? { scheduledAt: new Date(sanitized.scheduledAt as string) }
        : {}),
      ...(sanitized.initialServerId !== undefined
        ? { initialServerId: sanitized.initialServerId as string }
        : {}),
      ...(sanitized.tournamentName !== undefined
        ? { tournamentName: sanitized.tournamentName as string | null }
        : {}),
      ...(sanitized.category !== undefined
        ? { category: sanitized.category as string | null }
        : {}),
      ...(sanitized.roundName !== undefined
        ? { roundName: sanitized.roundName as string | null }
        : {}),
      ...(sanitized.bracketType !== undefined
        ? { bracketType: sanitized.bracketType as string | null }
        : {}),
      ...(sanitized.temperature !== undefined
        ? { temperature: sanitized.temperature as number | null }
        : {}),
      ...(sanitized.humidity !== undefined
        ? { humidity: sanitized.humidity as number | null }
        : {}),
    },
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
    expectedVersion?: number;
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

  const updateData: Record<string, unknown> = {
    state: 'FINISHED',
    finishedAt: new Date(),
    finishReason: options?.reason || 'COMPLETED',
  };

  // scoreState recebido do cliente tipicamente é apenas o estado (sem history).
  // Sobrescrever perderia o {state, history} persistido pela rota /point.
  // Se o snapshot recebido já contiver history, use-o; senão, verificar se o
  // scoreState existente tem history para preservar.
  const receivedHasHistory =
    scoreState && typeof scoreState === 'object' &&
    Array.isArray((scoreState as any).history) &&
    (scoreState as any).state;

  const existingHasHistory =
    match.scoreState && typeof match.scoreState === 'object' &&
    Array.isArray((match.scoreState as any).history) &&
    (match.scoreState as any).state;

  if (receivedHasHistory) {
    // Cliente enviou { state, history } — usar diretamente
    updateData.scoreState = scoreState;
  } else if (scoreState && !match.scoreState) {
    // Nada persistido antes: aceita o que veio (legado / races iniciais).
    updateData.scoreState = scoreState;
  } else if (scoreState && match.scoreState && !receivedHasHistory && existingHasHistory) {
    // FIX #11: O cliente enviou apenas `state` (sem history), mas o servidor
    // já tem {state, history}. Preservar o history existente e atualizar
    // apenas o state. Sem isso, uma edição de placar via PATCH /state
    // (que envia state plano) faria o scoreState do banco ficar defasado.
    updateData.scoreState = {
      state: scoreState,
      history: (match.scoreState as any).history,
    };
  }
  // Caso contrário: não tocar scoreState já persistido.

  if (options?.note) {
    updateData.finishNote = options.note;
  }

  if (options?.winnerId) {
    updateData.winnerId = options.winnerId;
  }

  // Optimistic lock: if version is provided, only update if version matches.
  // This prevents two concurrent finish requests from both succeeding.
  const whereClause: { id: string; version?: number } = { id };
  if (options?.expectedVersion !== undefined) {
    whereClause.version = options.expectedVersion;
  }

  try {
    return await prisma.match.update({
      where: whereClause,
      data: updateData,
      include: { player1: true, player2: true },
    });
  } catch (error: any) {
    if (error?.code === 'P2025' && options?.expectedVersion !== undefined) {
      return { error: 'VERSION_CONFLICT' } as const;
    }
    throw error;
  }
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

  // Uma edição manual de placar gera um "segmento fechado" quando isManualScoreEdit
  // está ativo. Se match.scoreState já existir, preservamos o estado anterior em
  // previousScoreState para que o /report reconstrua a timeline. Se for null
  // (primeira definição de placar), registramos com previousScoreState=null para
  // que o /report saiba que houve uma edição neste ponto.
  const shouldRecordSegment =
    Boolean(options?.isManualScoreEdit) &&
    Boolean(scoreState);

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