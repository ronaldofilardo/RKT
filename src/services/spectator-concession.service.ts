import { prisma } from '@/lib/prisma';
import { hashSpectateToken } from '@/lib/spectate-token';
import { MAX_SPECTATORS_PER_MATCH, isCreatorOrActiveAnnotator } from './spectator-share.service';

const ACCESS_WINDOW_DAYS = 7;

export async function hasActiveSpectatorConcession(matchId: string, userId: string): Promise<boolean> {
  const spectator = await prisma.matchSpectator.findFirst({
    where: { matchId, userId, revokedAt: null },
    include: { match: { select: { state: true, finishedAt: true } } },
  });
  if (!spectator) return false;
  if (spectator.match.state === 'FINISHED' && spectator.match.finishedAt) {
    const expiresAt = new Date(spectator.match.finishedAt).getTime() + ACCESS_WINDOW_DAYS * 86_400_000;
    if (Date.now() > expiresAt) return false;
  }
  return true;
}

export async function redeemShareLink(params: { token: string; userId: string }) {
  const { token, userId } = params;
  const tokenHash = hashSpectateToken(token);

  const link = await prisma.matchShareLink.findUnique({
    where: { tokenHash },
    include: { match: { select: { id: true, state: true, finishedAt: true, deletedAt: true } } },
  });

  if (!link || link.revokedAt || link.match.deletedAt || link.match.state === 'CANCELLED') {
    return { ok: false as const, error: 'INVITE_INVALID', status: 404 };
  }

  if (link.match.state === 'FINISHED' && link.match.finishedAt) {
    const expiresAt = new Date(link.match.finishedAt).getTime() + ACCESS_WINDOW_DAYS * 86_400_000;
    if (Date.now() > expiresAt) {
      return { ok: false as const, error: 'ACCESS_EXPIRED', status: 410 };
    }
  }

  const existing = await prisma.matchSpectator.findUnique({
    where: { matchId_userId: { matchId: link.matchId, userId } },
  });

  if (!existing || existing.revokedAt) {
    const activeCount = await prisma.matchSpectator.count({
      where: { matchId: link.matchId, revokedAt: null },
    });
    if (activeCount >= MAX_SPECTATORS_PER_MATCH) {
      return { ok: false as const, error: 'SPECTATOR_LIMIT', status: 403 };
    }
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.matchSpectator.upsert({
      where: { matchId_userId: { matchId: link.matchId, userId } },
      create: { matchId: link.matchId, userId, linkId: link.id, joinedAt: now, lastSeenAt: now },
      update: { linkId: link.id, revokedAt: null, lastSeenAt: now },
    }),
    prisma.matchShareLink.update({
      where: { id: link.id },
      data: { lastUsedAt: now },
    }),
  ]);

  return { ok: true as const, matchId: link.matchId };
}

export async function removeSpectator(params: { matchId: string; spectatorUserId: string; userId: string }) {
  const { matchId, spectatorUserId, userId } = params;
  const authorized = await isCreatorOrActiveAnnotator(matchId, userId);
  if (!authorized) return { ok: false as const, error: 'FORBIDDEN' };

  await prisma.matchSpectator.updateMany({
    where: { matchId, userId: spectatorUserId },
    data: { revokedAt: new Date() },
  });
  return { ok: true as const };
}

export async function listMySpectatingMatches(userId: string) {
  const matchSelect = {
    id: true,
    state: true,
    format: true,
    tournamentName: true,
    player1: { select: { id: true, name: true } },
    player2: { select: { id: true, name: true } },
    scoreState: true,
    updatedAt: true,
  };
  const spectators = await prisma.matchSpectator.findMany({
    where: { userId, revokedAt: null },
    include: { match: { select: matchSelect } },
    orderBy: { match: { updatedAt: 'desc' } },
  });
  return spectators.map((s) => s.match);
}
