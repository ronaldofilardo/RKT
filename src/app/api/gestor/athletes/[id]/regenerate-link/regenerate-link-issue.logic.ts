import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function issueAthleteLink(input: {
  ctId: string;
  userId: string;
  userEmail: string | null;
}): Promise<{ token: string; expiresAt: Date }> {
  const { ctId, userId, userEmail } = input;
  const token = Buffer.from(`${ctId}:${userId}:${Date.now()}`).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const codeHash = createHash('sha256').update(Math.floor(100000 + Math.random() * 900000).toString()).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.linkInvite.create({
    data: { ctId, kind: 'ATLETA', tokenHash, codeHash, createdByUserId: userId, expiresAt, maxUses: 1 },
  });

  const existingReset = await prisma.passwordResetRequest.findFirst({ where: { userId } });
  if (existingReset) {
    await prisma.passwordResetRequest.update({
      where: { id: existingReset.id },
      data: { status: 'LINK_ISSUED', tokenHash, tokenExpiresAt: expiresAt, issuedByUserId: userId, contactHint: userEmail },
    });
  } else {
    await prisma.passwordResetRequest.create({
      data: { userId, status: 'LINK_ISSUED', tokenHash, contactHint: userEmail, tokenExpiresAt: expiresAt, issuedByUserId: userId },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: true, tempPasswordExpiresAt: expiresAt },
  });

  return { token, expiresAt };
}

export async function issueGuardianNoticeForMinor(input: {
  ctId: string;
  playerId: string;
  issuedByUserId: string;
  expiresAt: Date;
}): Promise<{ guardianNoticeToken: string; guardianName?: string | null }> {
  const { ctId, playerId, issuedByUserId, expiresAt } = input;
  const guardianNoticeToken = randomBytes(24).toString('base64url');
  const tokenHash = createHash('sha256').update(guardianNoticeToken).digest('hex');

  const existing = await prisma.guardianInvite.findFirst({
    where: { playerId, createdByKind: 'GESTOR' },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    await prisma.guardianInvite.update({
      where: { id: existing.id },
      data: { tokenHash, expiresAt },
    });
    return { guardianNoticeToken, guardianName: existing.preGuardianName };
  }

  const codeHash = createHash('sha256').update(Math.floor(100000 + Math.random() * 900000).toString()).digest('hex');
  const created = await prisma.guardianInvite.create({
    data: { playerId, ctId, createdByUserId: issuedByUserId, createdByKind: 'GESTOR', tokenHash, codeHash, expiresAt },
  });
  return { guardianNoticeToken, guardianName: created.preGuardianName };
}

export async function checkMinorConsentStatus(playerId: string): Promise<boolean> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      guardianLinks: { where: { status: 'ACTIVE', revokedAt: null, confirmedAt: { not: null } }, take: 1 },
      guardianInvites: { where: { usedAt: { not: null } }, take: 1 },
      consentRecords: { take: 1 },
    },
  });
  if (!player) return false;
  return player.guardianLinks.length > 0 || player.guardianInvites.length > 0 || player.consentRecords.length > 0;
}

