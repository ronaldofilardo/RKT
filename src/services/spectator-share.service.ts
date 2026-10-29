import { prisma } from '@/lib/prisma';
import { generateSpectateToken } from '@/lib/spectate-token';
import { resolveShareOrigin } from './spectator-origin.logic';

export const MAX_SPECTATORS_PER_MATCH = 5;

export async function isCreatorOrActiveAnnotator(matchId: string, userId: string): Promise<boolean> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { createdByUserId: true },
  });
  if (match?.createdByUserId === userId) return true;

  const session = await prisma.matchAnnotationSession.findFirst({
    where: { matchId, annotatorUserId: userId, isActive: true },
    select: { id: true },
  });
  return !!session;
}

export async function createShareLink(params: {
  matchId: string;
  userId: string;
  label?: string | null;
  origin: string;
}) {
  const { matchId, userId, label, origin } = params;
  const authorized = await isCreatorOrActiveAnnotator(matchId, userId);
  if (!authorized) return { ok: false as const, error: 'FORBIDDEN' };

  const { token, tokenHash } = generateSpectateToken();

  const shareLink = await prisma.matchShareLink.create({
    data: {
      matchId,
      createdByUserId: userId,
      tokenHash,
      label: label?.trim() || null,
    },
    select: { id: true, label: true, createdAt: true },
  });

  const baseOrigin = resolveShareOrigin(origin);
  const url = `${baseOrigin}/matches/convite/${token}`;
  return { ok: true as const, linkId: shareLink.id, url, label: shareLink.label, createdAt: shareLink.createdAt.toISOString() };
}

export async function listShareLinks(matchId: string, userId: string) {
  const authorized = await isCreatorOrActiveAnnotator(matchId, userId);
  if (!authorized) return { ok: false as const, error: 'FORBIDDEN' };

  const [links, spectators] = await Promise.all([
    prisma.matchShareLink.findMany({
      where: { matchId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, createdAt: true, revokedAt: true, lastUsedAt: true },
    }),
    prisma.matchSpectator.findMany({
      where: { matchId, revokedAt: null },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return { ok: true as const, links, spectators, maxSpectators: MAX_SPECTATORS_PER_MATCH };
}

export async function revokeShareLink(params: { matchId: string; linkId: string; userId: string }) {
  const { matchId, linkId, userId } = params;
  const authorized = await isCreatorOrActiveAnnotator(matchId, userId);
  if (!authorized) return { ok: false as const, error: 'FORBIDDEN' };

  const now = new Date();
  await prisma.$transaction([
    prisma.matchShareLink.updateMany({
      where: { id: linkId, matchId },
      data: { revokedAt: now },
    }),
    prisma.matchSpectator.updateMany({
      where: { linkId, matchId },
      data: { revokedAt: now },
    }),
  ]);

  return { ok: true as const };
}

