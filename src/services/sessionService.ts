import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { getUserSessions } from "@/services/session-service-queries.logic";

export {
  listSessions,
  getSessionWithMatch,
  getUserSessions,
  checkMatchExists,
  getMatchScoreState,
  updateSession,
  createEndorsement,
} from "@/services/session-service-queries.logic";

export async function listSuspendedSessions(userId: string) {
  const allSessions = await prisma.matchAnnotationSession.findMany({
    where: {
      annotatorUserId: userId,
      status: "ABANDONED",
      matchStateSnapshot: { not: null },
    },
    select: {
      id: true,
      matchId: true,
      annotatorUserId: true,
      isActive: true,
      status: true,
      matchStateSnapshot: true,
      match: {
        select: {
          id: true,
          state: true,
          format: true,
          sportType: true,
          scheduledAt: true,
          scoreState: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const filtered = allSessions.filter((s) => {
    const matchOk = !s.match || ["IN_PROGRESS", "FINISHED"].includes(s.match.state);
    logger.log(
      `[listSuspendedSessions] Filtering session ${s.id}: status=${s.status}, matchState=${s.match?.state} (ok=${matchOk})`,
    );
    return matchOk;
  });

  logger.log(
    `[listSuspendedSessions] Total: ${allSessions.length}, Filtered: ${filtered.length}`,
  );

  return filtered;
}

export async function reactivateOrCreateSession(
  matchId: string,
  userId: string,
  _existingSessions?: Awaited<ReturnType<typeof getUserSessions>>,
) {
  return prisma.$transaction(async (tx) => {
    const lockKey = `session_${matchId}_${userId}`;
    const txWithRawSql = tx as Prisma.TransactionClient & {
      $executeRaw?: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
    };
    if (typeof txWithRawSql.$executeRaw === 'function') {
      try {
        await txWithRawSql.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      } catch (error) {
        logger.warn('[SESSION] Dialeto sem pg_advisory_xact_lock; lock de sessão ignorado:', error);
      }
    }

    // Busca atômica dentro da transação após adquirir o lock da sessão (ou usa o parâmetro se fornecido explicitamente)
    const existingSessions =
      _existingSessions ??
      (tx.matchAnnotationSession?.findMany
        ? await tx.matchAnnotationSession.findMany({
            where: { matchId, annotatorUserId: userId },
            include: { annotator: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
          })
        : await prisma.matchAnnotationSession.findMany({
            where: { matchId, annotatorUserId: userId },
            include: { annotator: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
          }));

    if (existingSessions.length > 1) {
      const olderIds = existingSessions.slice(1).map((s) => s.id);
      await tx.matchAnnotationSession.updateMany({
        where: { id: { in: olderIds } },
        data: { status: "ABANDONED", isActive: false },
      });
    }

    const mostRecent = existingSessions[0];
    if (mostRecent) {
      return tx.matchAnnotationSession.update({
        where: { id: mostRecent.id },
        data: { isActive: true, status: "IN_PROGRESS" },
        include: {
          annotator: { select: { id: true, name: true, email: true } },
        },
      });
    }

    return tx.matchAnnotationSession.create({
      data: {
        matchId,
        annotatorUserId: userId,
        isActive: true,
        status: "IN_PROGRESS",
      },
      include: { annotator: { select: { id: true, name: true, email: true } } },
    });
  });
}

/**
 * Desativa sessões de anotação que ficaram ativas sem finalização por mais de `maxAgeHours` horas.
 * Previne locks órfãos e poluição de sessões suspensas.
 */
export async function cleanupStaleSessions(
  options: { matchId?: string; maxAgeHours?: number } = {},
) {
  const maxAgeHours = options.maxAgeHours ?? 4;
  const cutoffDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

  const whereClause: {
    isActive: boolean;
    createdAt: { lt: Date };
    matchId?: string;
  } = {
    isActive: true,
    createdAt: { lt: cutoffDate },
  };

  if (options.matchId) {
    whereClause.matchId = options.matchId;
  }

  const result = await prisma.matchAnnotationSession.updateMany({
    where: whereClause,
    data: {
      isActive: false,
      status: "ABANDONED",
    },
  });

  if (result.count > 0) {
    logger.info(
      `[cleanupStaleSessions] Desativadas ${result.count} sessões órfãs mais antigas que ${maxAgeHours} horas`,
    );
  }

  return result;
}

