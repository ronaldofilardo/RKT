import { prisma } from "@/lib/prisma";
import type { MatchState } from "@/schemas/contracts";
import { BASE_MATCH_SELECT, FULL_MATCH_SELECT } from "./match-repository-select.data";

export async function listMatches(
  state?: string | null,
  cursor?: string | null,
  limit = 20,
  createdByUserId?: string | null,
  contextId?: string | null,
  followedPlayerIds?: readonly string[] | null,
) {
  if (!createdByUserId) {
    return [];
  }

  const orConditions: Record<string, unknown>[] = [];

  if (contextId === 'PARTICULAR') {
    orConditions.push({ ctId: null, createdByUserId });
  } else if (contextId) {
    orConditions.push({ ctId: contextId });
  } else {
    orConditions.push({ createdByUserId });
  }

  if (followedPlayerIds && followedPlayerIds.length > 0) {
    // Partidas onde atletas seguidos participam NÃO filtram por ctId:
    // um treinador avulso pode ver um atleta pessoal jogando em partida de um clube ao qual também pertence.
    for (const field of ['player1Id', 'player2Id', 'player1PartnerId', 'player2PartnerId']) {
      orConditions.push({ [field]: { in: followedPlayerIds } });
    }
  }

  const where: Record<string, unknown> = {
    deletedAt: null,
    ...(state ? { state: state as MatchState } : {}),
  };

  if (orConditions.length === 1) {
    Object.assign(where, orConditions[0]);
  } else {
    where.OR = orConditions;
  }

  return prisma.match.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
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
