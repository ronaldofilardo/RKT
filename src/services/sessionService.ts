import { prisma } from "@/lib/prisma";
import type { AnnotationSessionStatus } from "@/schemas/contracts";

export async function listSessions(matchId: string) {
  return prisma.matchAnnotationSession.findMany({
    where: { matchId },
    select: {
      id: true,
      annotatorUserId: true,
      isActive: true,
      startedAt: true,
      endedAt: true,
      matchStateSnapshot: true,
      status: true,
      createdAt: true,
      annotator: { select: { id: true, name: true, email: true } },
      endorsements: {
        include: { endorsedBy: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSessionWithMatch(sessionId: string, matchId: string) {
  return prisma.matchAnnotationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      matchId: true,
      annotatorUserId: true,
      isActive: true,
      status: true,
    },
  });
}

export async function getUserSessions(matchId: string, userId: string) {
  return prisma.matchAnnotationSession.findMany({
    where: { matchId, annotatorUserId: userId },
    include: { annotator: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function checkMatchExists(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    select: {
      state: true,
      openForAnnotation: true,
      version: true,
      scoreState: true,
    },
  });
}

export async function getMatchScoreState(matchId: string) {
  return prisma.match.findUnique({
    where: { id: matchId },
    select: { scoreState: true },
  });
}

export async function updateSession(
  sessionId: string,
  data: {
    status?: AnnotationSessionStatus;
    isActive?: boolean;
    endedAt?: Date;
    matchStateSnapshot?: string | null;
    finalStateSnapshot?: string | null;
  },
) {
  return prisma.matchAnnotationSession.update({
    where: { id: sessionId },
    data,
    include: { annotator: { select: { id: true, name: true, email: true } } },
  });
}

export async function listSuspendedSessions(userId: string) {
  const allSessions = await prisma.matchAnnotationSession.findMany({
    where: {
      annotatorUserId: userId,
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
  });

  const filtered = allSessions.filter((s) => {
    const statusOk = ["ABANDONED", "IN_PROGRESS"].includes(s.status);
    const matchOk = !s.match || ["IN_PROGRESS", "FINISHED"].includes(s.match.state);
    console.log(
      `[listSuspendedSessions] Filtering session ${s.id}: status=${s.status} (ok=${statusOk}), matchState=${s.match?.state} (ok=${matchOk})`,
    );
    return statusOk && matchOk;
  });

  console.log(
    `[listSuspendedSessions] Total: ${allSessions.length}, Filtered: ${filtered.length}`,
  );

  return filtered;
}

export async function createEndorsement(sessionId: string, userId: string) {
  return prisma.annotationEndorsement.create({
    data: { sessionId, endorsedByUserId: userId },
    include: { endorsedBy: { select: { id: true, name: true, email: true } } },
  });
}

export async function reactivateOrCreateSession(
  matchId: string,
  userId: string,
  existingSessions: Awaited<ReturnType<typeof getUserSessions>>,
) {
  return prisma.$transaction(async (tx) => {
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
