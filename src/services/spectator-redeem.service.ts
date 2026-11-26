import { prisma } from '@/lib/prisma';
import { hashSpectateToken } from '@/lib/spectate-token';
import { MAX_SPECTATORS_PER_MATCH } from './spectator-share.service';
import { canUserAccessCircleMatch, normalizeMatchVisibility } from './spectator-visibility.logic';

export const ACCESS_WINDOW_DAYS = 7;

export async function redeemShareLink(params: { token: string; userId?: string }) {
  const { token, userId } = params;
  const tokenHash = hashSpectateToken(token);

  const link = await prisma.matchShareLink.findUnique({
    where: { tokenHash },
    include: { match: { select: { id: true, state: true, finishedAt: true, deletedAt: true, visibility: true } } },
  });

  if (!link || link.revokedAt || link.match.deletedAt || link.match.state === 'CANCELLED') {
    return { ok: false as const, error: 'INVITE_INVALID', status: 404 };
  }

  const visibility = normalizeMatchVisibility(link.match.visibility);
  if (visibility === 'PRIVATE') {
    return { ok: false as const, error: 'MATCH_PRIVATE', status: 403 };
  }

  if (visibility === 'CIRCLE') {
    if (!userId) {
      return { ok: false as const, error: 'CIRCLE_ACCOUNT_REQUIRED', status: 401 };
    }
    const inCircle = await canUserAccessCircleMatch(link.matchId, userId);
    if (!inCircle) {
      return { ok: false as const, error: 'NOT_IN_CIRCLE', status: 403 };
    }
  }

  if (link.match.state === 'FINISHED' && link.match.finishedAt) {
    const expiresAt = new Date(link.match.finishedAt).getTime() + ACCESS_WINDOW_DAYS * 86_400_000;
    if (Date.now() > expiresAt) return { ok: false as const, error: 'ACCESS_EXPIRED', status: 410 };
  }

  if (visibility === 'CIRCLE') {
    const activeCount = await prisma.matchSpectator.count({
      where: { matchId: link.matchId, revokedAt: null },
    });
    if (activeCount >= MAX_SPECTATORS_PER_MATCH) {
      return { ok: false as const, error: 'SPECTATOR_LIMIT', status: 403 };
    }
  }

  const now = new Date();
  if (userId) {
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
  } else {
    await prisma.matchShareLink.update({
      where: { id: link.id },
      data: { lastUsedAt: now },
    });
  }

  return { ok: true as const, matchId: link.matchId };
}
