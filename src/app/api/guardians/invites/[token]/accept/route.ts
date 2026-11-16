import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';

const AcceptSchema = z.object({
  relationship: z.string().min(2).max(50),
  purposes: z.array(z.enum(['DATA', 'BROADCAST', 'STATS'])).min(1),
  termsVersion: z.string().default('1.0'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const user = await getAccessUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { token } = await params;
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const invite = await prisma.guardianInvite.findUnique({
    where: { tokenHash },
    include: { player: { select: { id: true, userId: true, name: true } } },
  });
  if (!invite || invite.revokedAt || invite.usedAt) {
    return NextResponse.json({ error: 'INVALID_INVITE', message: 'Convite inválido ou expirado.' }, { status: 404 });
  }
  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: 'EXPIRED_INVITE', message: 'Este convite expirou.' }, { status: 410 });
  }
  if (invite.player.userId === user.id) {
    return NextResponse.json({ error: 'SELF_GUARDIAN_PROHIBITED', message: 'O atleta não pode ser seu próprio responsável.' }, { status: 403 });
  }

  const activeLink = await prisma.guardianLink.findFirst({
    where: { playerId: invite.playerId, status: 'ACTIVE', revokedAt: null },
  });
  if (activeLink) {
    return NextResponse.json({ error: 'MONOTUTELA_CONFLICT', message: 'O atleta já possui um responsável legal ativo.' }, { status: 409 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = AcceptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });

  const { relationship, purposes, termsVersion } = parsed.data;
  const ipHash = Buffer.from(request.headers.get('x-forwarded-for') || 'local').toString('base64');
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.guardianInvite.update({
      where: { id: invite.id },
      data: { usedAt: now, guardianUserId: user.id },
    });

    await tx.guardianLink.create({
      data: {
        guardianUserId: user.id, playerId: invite.playerId, relation: relationship,
        status: 'ACTIVE', confirmedAt: now, verificationLevel: invite.preGuardianCpfHash ? 'N2_PRE_VALIDADO' : 'N1_CONVITE',
      },
    });

    for (const purpose of purposes) {
      await tx.consentRecord.create({
        data: { guardianUserId: user.id, playerId: invite.playerId, purpose, termsVersion, grantedAt: now, ipHash },
      });
      await tx.consentEvent.create({
        data: {
          playerId: invite.playerId, guardianUserId: user.id, purpose, action: 'GRANT',
          termsVersion, ipHash, inviteId: invite.id, verificationLevel: invite.preGuardianCpfHash ? 'N2_PRE_VALIDADO' : 'N1_CONVITE',
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: user.id, action: 'GUARDIAN_INVITE_ACCEPTED', resourceType: 'GuardianInvite',
        resourceId: invite.id, meta: { playerId: invite.playerId, relationship, purposes }, ipHash,
      },
    });
  });

  return NextResponse.json({ ok: true, message: 'Vínculo de tutela e autorizações confirmadas com sucesso.' });
}
