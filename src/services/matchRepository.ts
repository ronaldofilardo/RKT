import { prisma } from "@/lib/prisma";
import type { MatchState } from "@/schemas/contracts";
import { BASE_MATCH_SELECT, FULL_MATCH_SELECT } from "./match-repository-select.data";

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
    select: BASE_MATCH_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getMatch(id: string) {
  return prisma.match.findFirst({
    where: { id, deletedAt: null },
    select: FULL_MATCH_SELECT,
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
