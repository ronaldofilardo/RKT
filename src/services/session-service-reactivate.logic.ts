import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { getUserSessions } from "@/services/session-service-queries.logic";

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
