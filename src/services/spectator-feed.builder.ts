import { prisma } from '@/lib/prisma';
import { toSpectatorView, formatSpectatorGame } from '@/core/spectate';
import { loadSpectatorPointMeta } from './spectator-feed.timeline';
import { extractSpectatorPointDetails } from './spectator-feed.point-details';
import { buildScoreEditMarkers } from './spectator-feed.score-edits';
import { getMatchScoreEdits } from './matchService';
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
          clientEventId: true,
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

  const lastSet = sets[sets.length - 1];
  // Tie-break em andamento: set com tiebreakScore e games empatados (6-6 / 0-0 do match tie-break).
  const liveTiebreak =
    match.state !== 'FINISHED' && lastSet?.tiebreak && lastSet.player1 === lastSet.player2
      ? lastSet.tiebreak
      : null;

  const currentGame = formatSpectatorGame(normalized?.currentGame, liveTiebreak);
  const scoreEdits = await getMatchScoreEdits(matchId).catch(() => []);
  const markers = buildScoreEditMarkers(scoreEdits, match.pointLog, match.format);
  const pointMeta = await loadSpectatorPointMeta(match, match.pointLog, currentGame, scoreEdits);
  const isSide1 = (id: string | null | undefined) =>
    Boolean(id) && (id === match.player1Id || id === match.player1PartnerId);

  const spectatorPoints: SpectatorPoint[] = match.pointLog.map((pt, idx) => {
    const ann = (pt.annotations as Record<string, unknown>) ?? {};
    const meta = pointMeta.get(pt.id);
    return {
      id: pt.id,
      seq: pt.sequenceNumber ?? idx + 1,
      setNumber: meta?.setNumber ?? (ann.setNumber as number) ?? 1,
      gameNumber: meta?.gameNumber ?? (ann.gameNumber as number) ?? 1,
      scoreAfter: meta?.scoreAfter ?? (typeof ann.scoreAfter === 'string' ? ann.scoreAfter : ''),
      winnerSide: isSide1(pt.winnerId) ? 'side1' : 'side2',
      serverSide: isSide1(pt.serverId) ? 'side1' : 'side2',
      type: pt.type,
      details: extractSpectatorPointDetails(ann),
      isBreakPoint: meta?.isBreakPoint ?? Boolean(ann.isBreakPoint),
      receivedLate: pt.receivedAt.getTime() - pt.timestamp.getTime() > 30_000,
    };
  });

  const server = normalized?.server;

  return toSpectatorView({
    match,
    player1: match.player1,
    player2: match.player2,
    player1Partner: match.player1Partner,
    player2Partner: match.player2Partner,
    score: {
      sets,
      currentGame,
      serverSide: server === 'player1' ? 'side1' : server === 'player2' ? 'side2' : null,
      isTiebreak: Boolean(liveTiebreak),
    },
    points: spectatorPoints,
    markers,
    annotatorName,
    guardianPlayerIds: guardianPlayerIds ? [...guardianPlayerIds] : [],
  });
}
