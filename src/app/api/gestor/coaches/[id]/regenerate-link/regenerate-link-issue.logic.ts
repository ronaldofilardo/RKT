import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

/** Emite link de acesso do treinador (espelho de issueAthleteLink, kind TREINADOR). */
export async function issueCoachLink(input: {
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
    data: { ctId, kind: 'TREINADOR', tokenHash, codeHash, createdByUserId: userId, expiresAt, maxUses: 1 },
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
