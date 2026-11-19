import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import type { CreateMatchInput } from "@/schemas/contracts";
import { assertPublicMatchGuards } from "./match-template-guards.logic";
import {
  validateCreateMatchPlayers,
  warnMissingCreator,
  buildCreateMatchData,
} from "./match-service-create.logic";

export async function createMatch(
  data: CreateMatchInput,
  createdByUserId?: string,
  tx?: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
) {
  validateCreateMatchPlayers(data);
  warnMissingCreator(createdByUserId);

  if (data.eventScope === 'PUBLIC' || data.isPublicTemplate) {
    await assertPublicMatchGuards({
      createdByUserId,
      playerIds: [data.player1Id, data.player2Id, data.player1PartnerId, data.player2PartnerId],
    });
  }

  const client = tx ?? prisma;
  const matchData = buildCreateMatchData(data, createdByUserId);

  return client.match.create({
    data: matchData,
    include: { player1: true, player2: true },
  });
}
