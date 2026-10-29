import { prisma } from '@/lib/prisma';
import { toSpectatorView } from '@/core/spectate';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import type { SpectatorView, SpectatorPoint } from '@/core/spectate';

export async function buildFullSpectatorView(params: {
  matchId: string;
  annotatorName?: string | null;
  guardianPlayerIds?: readonly string[];
}): Promise<SpectatorView | null> {
  const { matchId, annotatorName, guardianPlayerIds } = params;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      player1: { select: { id: true, name: true, birthDate: true } },
      player2: { select: { id: true, name: true, birthDate: true } },
      player1Partner: { select: { id: true, name: true, birthDate: true } },
      player2Partner: { select: { id: true, name: true, birthDate: true } },
      pointLog: {
        where: { voidedAt: null },
        orderBy: { sequenceNumber: 'asc' },
        select: {
          id: true,
          sequenceNumber: true,
          type: true,
          serverId: true,
          winnerId: true,
          timestamp: true,
          receivedAt: true,
          annotations: true,
        },
      },
    },
  });

  if (!match) return null;

  const normalized = normalizeScoreState(match.scoreState);
  const sets = (normalized?.sets ?? []).map((s) => ({
    player1: s.player1,
    player2: s.player2,
    tiebreak: s.isTiebreak && s.tiebreakScore ? s.tiebreakScore : null,
  }));

  const spectatorPoints: SpectatorPoint[] = match.pointLog.map((pt, idx) => {
    const ann = (pt.annotations as Record<string, unknown>) ?? {};
    const isP1Winner = pt.winnerId === match.player1Id || pt.winnerId === match.player1PartnerId;
    return {
      id: pt.id,
      seq: pt.sequenceNumber ?? idx + 1,
      setNumber: (ann.setNumber as number) ?? 1,
      gameNumber: (ann.gameNumber as number) ?? 1,
      scoreAfter: (ann.scoreAfter as string) ?? '',
      winnerSide: isP1Winner ? 'side1' : 'side2',
      serverSide: pt.serverId === match.player1Id ? 'side1' : 'side2',
      type: pt.type,
      isBreakPoint: Boolean(ann.isBreakPoint),
      receivedLate: pt.receivedAt.getTime() - pt.timestamp.getTime() > 30_000,
    };
  });

  const p1Game = String(normalized?.currentGame?.player1 ?? '0');
  const p2Game = String(normalized?.currentGame?.player2 ?? '0');
  const isCurrentTiebreak = sets.length > 0 && Boolean(sets[sets.length - 1].tiebreak);

  return toSpectatorView({
    match,
    player1: match.player1,
    player2: match.player2,
    player1Partner: match.player1Partner,
    player2Partner: match.player2Partner,
    score: {
      sets,
      currentGame: { player1: p1Game, player2: p2Game },
      serverSide: normalized?.server === 'player1' ? 'side1' : 'side2',
      isTiebreak: isCurrentTiebreak,
    },
    points: spectatorPoints,
    annotatorName,
    guardianPlayerIds: guardianPlayerIds ? [...guardianPlayerIds] : [],
  });
}
