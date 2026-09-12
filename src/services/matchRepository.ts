import { prisma } from "@/lib/prisma";
import type { MatchState } from "@/schemas/contracts";

export async function listMatches(
  state?: string | null,
  cursor?: string | null,
  limit = 20,
  createdByUserId?: string | null,
) {
  // Isolamento estrito: partidas pertencem ao anotador que as criou.
  // Se createdByUserId não for fornecido (ex: admin), retorna lista vazia.
  if (!createdByUserId) {
    return [];
  }

  return prisma.match.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: {
      deletedAt: null,
      createdByUserId,
      ...(state ? { state: state as MatchState } : {}),
    },
    select: {
      id: true,
      state: true,
      format: true,
      sportType: true,
      courtType: true,
      scheduledAt: true,
      startedAt: true,
      finishedAt: true,
      nickname: true,
      visibility: true,
      isResuming: true,
      openForAnnotation: true,
      tournamentName: true,
      category: true,
      round: true,
      bracketType: true,
      temperature: true,
      humidity: true,
      version: true,
      scoreState: true,
      initialServerId: true,
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
      createdByUserId: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMatch(id: string) {
  return prisma.match.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      state: true,
      format: true,
      sportType: true,
      courtType: true,
      scheduledAt: true,
      startedAt: true,
      finishedAt: true,
      nickname: true,
      visibility: true,
      isResuming: true,
      openForAnnotation: true,
      tournamentName: true,
      category: true,
      round: true,
      bracketType: true,
      temperature: true,
      humidity: true,
      version: true,
      scoreState: true,
      initialServerId: true,
      winnerId: true,
      finishReason: true,
      finishNote: true,
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
      createdByUserId: true,
    },
  });
}

export async function findAbandonedSessionSnapshot(matchId: string) {
  return prisma.matchAnnotationSession.findFirst({
    where: {
      matchId,
      status: "ABANDONED",
      matchStateSnapshot: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });
}