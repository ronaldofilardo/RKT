import { prisma } from '@/lib/prisma';
import { hashSpectateToken } from '@/lib/spectate-token';
import { isCreatorOrActiveAnnotator } from './spectator-share.service';
import { ACCESS_WINDOW_DAYS } from './spectator-redeem.service';

export { redeemShareLink } from './spectator-redeem.service';

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

export async function isGuestSpectatorAuthorized(matchId: string, token: string): Promise<boolean> {
  if (!token) return false;
  const tokenHash = hashSpectateToken(token);
  const link = await prisma.matchShareLink.findUnique({
    where: { tokenHash },
    select: { matchId: true, revokedAt: true },
  });
  return Boolean(link && link.matchId === matchId && !link.revokedAt);
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
