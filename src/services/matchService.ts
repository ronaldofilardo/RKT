import { prisma } from "@/lib/prisma";
import { listMatches, getMatch, findAbandonedSessionSnapshot } from "./matchRepository";

export { listMatches, getMatch, findAbandonedSessionSnapshot };
export { createMatch } from './match-service-create.service';
export { deleteMatch } from './match-service-delete.service';
export { updateMatch } from './match-service-update.service';
export { finishMatch } from './match-service-finish.service';
export { transitionMatchState } from './match-service-transition.service';

export async function getMatchScoreEdits(matchId: string) {
  return prisma.matchScoreEdit.findMany({
    where: { matchId },
    orderBy: { editedAt: "asc" },
    select: {
      id: true,
      editedAt: true,
      editedByUserId: true,
      previousScoreState: true,
      newScoreState: true,
      note: true,
    },
  });
}