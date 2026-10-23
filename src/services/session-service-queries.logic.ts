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

export async function getSessionWithMatch(sessionId: string, _matchId: string) {
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
      _count: {
        select: { pointLog: true },
      },
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
    updatedAt?: Date;
  },
) {
  return prisma.matchAnnotationSession.update({
    where: { id: sessionId },
    data,
    include: { annotator: { select: { id: true, name: true, email: true } } },
  });
}

export async function createEndorsement(sessionId: string, userId: string) {
  return prisma.annotationEndorsement.create({
    data: { sessionId, endorsedByUserId: userId },
    include: { endorsedBy: { select: { id: true, name: true, email: true } } },
  });
}
