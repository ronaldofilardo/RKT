import { prisma } from "@/lib/prisma";
import { BASE_MATCH_SELECT, FULL_MATCH_SELECT } from "./match-repository-select.data";
import { buildMatchListWhere, type MatchListScope } from "./match-repository-where.logic";

export type { MatchListScope };

export async function listMatches(
  state?: string | null,
  cursor?: string | null,
  limit = 20,
  createdByUserId?: string | null,
  contextId?: string | null,
  followedPlayerIds?: readonly string[] | null,
  scope?: MatchListScope | null,
  assignedCoachId?: string | null,
  athletePlayerId?: string | null,
  guardianOfPlayerIds?: readonly string[] | null,
) {
  if (!createdByUserId) return [];

  const where = buildMatchListWhere({
    state,
    createdByUserId,
    contextId,
    scope,
    assignedCoachId,
    athletePlayerId,
    followedPlayerIds,
    guardianOfPlayerIds,
  });

  return prisma.match.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
    select: BASE_MATCH_SELECT,
    // Desempate por id: sem ele o cursor (`skip: 1 + cursor`) pode pular ou repetir
    // registros com `createdAt` idêntico (lotes criados na mesma transação).
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export { loadCtMemberUserIds } from './match-repository-ct-members.logic';

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
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
