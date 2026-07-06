import { prisma } from "@/lib/prisma";
import type {
  MatchFormat,
  MatchState,
  CreateMatchInput,
} from "@/schemas/contracts";
import { ScoringEngine } from "@/core/scoring/engine";

export async function listMatches(
  state?: string | null,
  cursor?: string | null,
  limit = 20,
) {
  return prisma.match.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: {
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
      includeLet: true,
      round: true,
      bracketType: true,
      temperature: true,
      humidity: true,
      version: true,
      scoreState: true,
      initialServerId: true,
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMatch(id: string) {
  return prisma.match.findFirst({
    where: { id },
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
      includeLet: true,
      round: true,
      bracketType: true,
      temperature: true,
      humidity: true,
      version: true,
      scoreState: true,
      initialServerId: true,
      player1: { select: { id: true, name: true } },
      player2: { select: { id: true, name: true } },
    },
  });
}

export async function createMatch(data: CreateMatchInput) {
  const {
    player1Id,
    player2Id,
    format,
    sportType,
    courtType,
    scheduledAt,
    initialServerId,
    nickname,
    visibility,
    openForAnnotation,
    tournamentName,
    category,
    includeLet,
    round,
    roundName,
    bracketType,
    temperature,
    humidity,
  } = data;

  return prisma.match.create({
    data: {
      format: format as MatchFormat,
      sportType: sportType || "TENNIS",
      courtType: courtType || null,
      nickname: nickname || null,
      visibility: visibility || "PUBLIC",
      openForAnnotation: openForAnnotation || false,
      tournamentName: tournamentName || null,
      category: category || null,
      includeLet: includeLet ?? null,
      round: round || roundName || null,
      bracketType: bracketType || null,
      temperature: temperature || null,
      humidity: humidity || null,
      state: "SCHEDULED",
      player1Id,
      player2Id,
      ...(initialServerId ? { initialServerId } : {}),
      scheduledAt: scheduledAt || null,
    },
    include: { player1: true, player2: true },
  });
}

export async function updateMatch(id: string, data: Record<string, unknown>) {
  const match = await prisma.match.findFirst({ where: { id } });
  if (!match) return null;

  return prisma.match.update({
    where: { id },
    data: {
      ...(data.nickname !== undefined
        ? { nickname: data.nickname as string }
        : {}),
      ...(data.sportType !== undefined
        ? { sportType: data.sportType as string }
        : {}),
      ...(data.courtType !== undefined
        ? { courtType: data.courtType as string | null }
        : {}),
      ...(data.visibility !== undefined
        ? { visibility: data.visibility as string }
        : {}),
      ...(data.openForAnnotation !== undefined
        ? { openForAnnotation: data.openForAnnotation as boolean }
        : {}),
      ...(data.scheduledAt !== undefined
        ? { scheduledAt: new Date(data.scheduledAt as string) }
        : {}),
    },
    include: { player1: true, player2: true },
  });
}

export async function deleteMatch(id: string) {
  const match = await prisma.match.findFirst({ where: { id } });
  if (!match) return false;

  await prisma.match.delete({ where: { id } });
  return true;
}

export async function transitionMatchState(
  id: string,
  newState: MatchState,
  initialServerId?: string,
  scoreState?: unknown,
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: { player1: true, player2: true },
  });
  if (!match) return null;

  if (newState === "FINISHED") {
    if (!match.scoreState && !scoreState)
      return {
        error: "CANNOT_FINISH: Partida sem pontuação registrada",
      } as const;
    if (!match.initialServerId)
      return {
        error: "MATCH_NOT_STARTED: Partida sem primeiro sacador definido",
      } as const;

    // Use the incoming scoreState if provided (it represents the latest state),
    // otherwise fall back to the stored match.scoreState.
    const stateToValidate = scoreState ? JSON.stringify(scoreState) : JSON.stringify(match.scoreState);
    const engine = ScoringEngine.fromSerialized(
      {
        format: match.format,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        initialServerId: match.initialServerId,
      },
      stateToValidate,
    );
    if (!engine.isFinished()) {
      return {
        error: "CANNOT_FINISH: Motor de pontuação indica partida em andamento",
      } as const;
    }
  }

  // Floor validation: prevent score regression (new setsWon cannot be less than stored)
  if (scoreState && match.scoreState) {
    const oldState = match.scoreState as any;
    const newState_ = scoreState as any;
    const oldWon = oldState?.setsWon ?? { player1: 0, player2: 0 };
    const newWon = newState_?.setsWon ?? { player1: 0, player2: 0 };
    if (
      typeof newWon.player1 === "number" &&
      typeof newWon.player2 === "number" &&
      (newWon.player1 < oldWon.player1 || newWon.player2 < oldWon.player2)
    ) {
      return {
        error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
      } as const;
    }

    if (
      typeof newWon.player1 === "number" &&
      typeof newWon.player2 === "number" &&
      newWon.player1 === oldWon.player1 &&
      newWon.player2 === oldWon.player2 &&
      isCurrentGameRegressing(oldState?.currentGame, newState_?.currentGame)
    ) {
      const oldLastSet = oldState?.sets?.[(oldState.sets.length || 1) - 1];
      const newLastSet = newState_?.sets?.[(newState_.sets.length || 1) - 1];
      const sameCurrentGameContext =
        oldLastSet && newLastSet
          ? oldLastSet.player1 === newLastSet.player1 &&
            oldLastSet.player2 === newLastSet.player2
          : true;

      if (sameCurrentGameContext) {
        return {
          error: "SCORE_REGRESSION: Placar não pode ser inferior ao estado atual",
        } as const;
      }
    }
  }

  return prisma.match.update({
    where: { id },
    data: {
      state: newState,
      ...(newState === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
      ...(newState === "FINISHED" ? { finishedAt: new Date() } : {}),
      ...(initialServerId ? { initialServerId } : {}),
      ...(scoreState ? { scoreState: scoreState as any } : {}),
    },
    include: { player1: true, player2: true },
  });
}

function getGameProgress(cg: any, player: string): number {
  if (!cg) return 0;
  const p = typeof cg[player] === 'number' ? cg[player] : 0;
  if (cg.isDeuce) {
    if (cg.advantage === player) return 4;
    return 3;
  }
  return p;
}

function isCurrentGameRegressing(oldCG: any, newCG: any): boolean {
  if (!oldCG || !newCG) return false;

  const oldP1 = getGameProgress(oldCG, 'player1');
  const oldP2 = getGameProgress(oldCG, 'player2');
  const newP1 = getGameProgress(newCG, 'player1');
  const newP2 = getGameProgress(newCG, 'player2');

  return (
    (newP1 < oldP1 && newP2 <= oldP2) ||
    (newP2 < oldP2 && newP1 <= oldP1)
  );
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
