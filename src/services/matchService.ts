import { prisma } from "@/lib/prisma";
import type {
  MatchFormat,
  MatchState,
  CreateMatchInput,
  MatchFinishReason,
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

export async function createMatch(data: CreateMatchInput, createdByUserId?: string) {
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
      ...(createdByUserId ? { createdByUserId } : {}),
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

export async function deleteMatch(
  id: string,
  options: {
    type: 'soft' | 'hard';
    reason?: string;
    deletedBy?: string;
  }
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: {
      pointLog: { select: { id: true } },
      annotationSessions: { select: { id: true } },
    },
  });

  if (!match) return { error: 'MATCH_NOT_FOUND' } as const;

  const hasPoints = match.pointLog.length > 0;
  const hasAnnotationSessions = match.annotationSessions.length > 0;

  if (match.state === 'FINISHED') {
    return {
      error: 'CANNOT_DELETE_FINISHED: Partidas finalizadas não podem ser excluídas permanentemente',
    } as const;
  }

  if (options.type === 'hard') {
    await prisma.$transaction([
      prisma.pointLog.deleteMany({ where: { matchId: id } }),
      prisma.matchAnnotationSession.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } }),
    ]);
    return { success: true, type: 'hard' } as const;
  }

  const updateData: Record<string, unknown> = {
    state: 'CANCELLED',
    deletedAt: new Date(),
  };
  if (options.deletedBy) {
    updateData.deletedBy = options.deletedBy;
  }
  if (options.reason) {
    updateData.finishNote = options.reason;
  }

  await prisma.match.update({
    where: { id },
    data: updateData,
  });

  return {
    success: true,
    type: 'soft',
    stats: {
      points: match.pointLog.length,
      annotationSessions: match.annotationSessions.length,
    },
  } as const;
}

export async function finishMatch(
  id: string,
  scoreState: unknown,
  options?: {
    reason?: MatchFinishReason;
    note?: string;
    winnerId?: string;
  }
) {
  const match = await prisma.match.findFirst({
    where: { id },
    include: { player1: true, player2: true },
  });

  if (!match) return { error: 'MATCH_NOT_FOUND' } as const;

  if (match.state === 'FINISHED') {
    return { error: 'ALREADY_FINISHED: Partida já está finalizada' } as const;
  }

  if (match.state === 'CANCELLED') {
    return { error: 'CANNOT_FINISH_CANCELLED: Partida cancelada não pode ser finalizada' } as const;
  }

  const reason = options?.reason || 'COMPLETED';

  if (reason === 'COMPLETED') {
    if (!scoreState) {
      return {
        error: 'CANNOT_FINISH: Partida sem pontuação registrada',
      } as const;
    }

    if (!match.initialServerId) {
      return {
        error: 'MATCH_NOT_STARTED: Partida sem primeiro sacador definido',
      } as const;
    }

    const engine = ScoringEngine.fromSerialized(
      {
        format: match.format,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        initialServerId: match.initialServerId,
      },
      JSON.stringify(scoreState),
    );

    if (!engine.isFinished()) {
      return {
        error: 'CANNOT_FINISH: Motor de pontuação indica partida em andamento',
      } as const;
    }
  }

  const updateData: Record<string, unknown> = {
    state: 'FINISHED',
    finishedAt: new Date(),
    finishReason: reason,
    scoreState: scoreState || match.scoreState,
  };

  if (options?.note) {
    updateData.finishNote = options.note;
  }

  if (options?.winnerId) {
    updateData.winnerId = options.winnerId;
  }

  return prisma.match.update({
    where: { id },
    data: updateData,
    include: { player1: true, player2: true },
  });
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
    
    // PROTEÇÃO #2 (Enhanced): Validação de regressão em tie-break
    const oldLastSet = oldState?.sets?.[(oldState.sets.length || 1) - 1];
    const newLastSet = newState_?.sets?.[(newState_.sets.length || 1) - 1];
    
    if (oldLastSet && newLastSet && isTiebreakRegressing(oldLastSet, newLastSet)) {
      return {
        error: "SCORE_REGRESSION: Tie-break não pode regredir",
      } as const;
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

  // PROTEÇÃO #2: Validação de regressão do game atual
  // Detecta regressão quando um jogador perde progresso sem que o outro avance
  return (
    (newP1 < oldP1 && newP2 <= oldP2) ||
    (newP2 < oldP2 && newP1 <= oldP1)
  );
}

/**
 * PROTEÇÃO #2 (Enhanced): Validação de regressão em tie-break
 * Verifica se há regressão nos pontos do tie-break quando aplicável
 * 
 * Cobre:
 * - Set tie-break regular (7 pts): isTiebreak=true, tiebreakScore presente
 * - Match tie-break (10 pts): isTiebreak=true, tiebreakScore com 10+ pontos
 * - Match tie-break mal persistido: isTiebreak=false mas tiebreakScore presente
 */
function isTiebreakRegressing(oldSet: any, newSet: any): boolean {
  if (!oldSet || !newSet) return false;
  
  const oldTb = oldSet.tiebreakScore;
  const newTb = newSet.tiebreakScore;
  
  // Caso 1: Ambos têm tiebreakScore definido (formato consistente)
  if (oldTb && newTb) {
    return (
      (newTb.player1 < oldTb.player1 && newTb.player2 <= oldTb.player2) ||
      (newTb.player2 < oldTb.player2 && newTb.player1 <= oldTb.player1)
    );
  }
  
  // Caso 2: Match tie-break persistido como games (formato legado/inconsistente)
  // oldSet tem tiebreakScore mas newSet não (ou vice-versa)
  if (oldTb && !newTb && oldSet.isTiebreak) {
    // newSet deveria ter tiebreakScore mas não tem - isso é uma mudança suspeita
    // Verificar se os games regrediram
    if (oldSet.player1 > 0 || oldSet.player2 > 0) {
      return (
        (newSet.player1 < oldSet.player1 && newSet.player2 <= oldSet.player2) ||
        (newSet.player2 < oldSet.player2 && newSet.player1 <= oldSet.player1)
      );
    }
  }
  
  // Caso 3: Match tie-break no formato "games" onde player1=10, player2=8
  // (quando isTiebreak=true mas tiebreakScore está como games)
  if (oldSet.isTiebreak && !oldTb && oldSet.player1 >= 6 && oldSet.player2 >= 6) {
    if (newSet.player1 > 0 || newSet.player2 > 0) {
      return (
        (newSet.player1 < oldSet.player1 && newSet.player2 <= oldSet.player2) ||
        (newSet.player2 < oldSet.player2 && newSet.player1 <= oldSet.player1)
      );
    }
  }
  
  return false;
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
