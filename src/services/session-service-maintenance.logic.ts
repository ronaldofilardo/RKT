import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

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
