import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';

export interface IssueAthleteLinkInput {
  userId: string;
  userEmail: string | null;
  ctId?: string | null;
  issuedByUserId?: string;
}

export async function issueAthleteFirstAccessLink(input: IssueAthleteLinkInput): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const { userId, userEmail, ctId, issuedByUserId } = input;
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const codeHash = createHash('sha256')
    .update(Math.floor(100000 + Math.random() * 900000).toString())
    .digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (ctId) {
    await prisma.linkInvite.create({
      data: {
        ctId,
        kind: 'ATLETA',
        tokenHash,
        codeHash,
        createdByUserId: issuedByUserId || userId,
        expiresAt,
        maxUses: 1,
      },
    });
  }

  const existingReset = await prisma.passwordResetRequest.findFirst({
    where: { userId },
  });

  if (existingReset) {
    await prisma.passwordResetRequest.update({
      where: { id: existingReset.id },
      data: {
        status: 'LINK_ISSUED',
        tokenHash,
        tokenExpiresAt: expiresAt,
        issuedByUserId: issuedByUserId || userId,
        contactHint: userEmail,
      },
    });
  } else {
    await prisma.passwordResetRequest.create({
      data: {
        userId,
        status: 'LINK_ISSUED',
        tokenHash,
        contactHint: userEmail,
        tokenExpiresAt: expiresAt,
        issuedByUserId: issuedByUserId || userId,
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { mustChangePassword: true, tempPasswordExpiresAt: expiresAt },
  });

  return { token, expiresAt };
}
