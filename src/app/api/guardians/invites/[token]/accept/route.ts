import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { validateGuardianCrossCheck, resolveGuardianUser } from './accept-validation.logic';

const AcceptSchema = z.object({
  guardianName: z.string().min(2).max(100).optional(),
  guardianCpf: z.string().optional(),
  relationship: z.string().min(2).max(50),
  purposes: z.array(z.enum(['DATA', 'BROADCAST', 'STATS'])).min(1),
  termsVersion: z.string().default('2.0'),
  contentHash: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const sessionUser = await getAccessUserFromRequest(request);
  const body = await request.json().catch(() => ({}));

  if (!sessionUser && !body.guardianCpf) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Faça login ou informe seu CPF para confirmar.' }, { status: 401 });
  }

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
  if (sessionUser && invite.player.userId === sessionUser.id) {
    return NextResponse.json({ error: 'SELF_GUARDIAN_PROHIBITED', message: 'O atleta não pode ser seu próprio responsável.' }, { status: 403 });
  }

  const activeLink = await prisma.guardianLink.findFirst({
    where: { playerId: invite.playerId, status: 'ACTIVE', revokedAt: null },
  });
  if (activeLink) return NextResponse.json({ error: 'MONOTUTELA_CONFLICT', message: 'O atleta já possui um responsável legal ativo.' }, { status: 409 });

  const parsed = AcceptSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: parsed.error.flatten() }, { status: 400 });

  const { guardianName, guardianCpf, relationship, purposes, termsVersion, contentHash } = parsed.data;
  const crossCheck = validateGuardianCrossCheck(invite, guardianCpf);
  if (!crossCheck.ok) return NextResponse.json({ error: crossCheck.error, message: crossCheck.message }, { status: 422 });

  const targetCpf = crossCheck.cleanedCpf || (invite.preGuardianCpf ? invite.preGuardianCpf.replace(/\D/g, '') : null);
  const targetName = guardianName || invite.preGuardianName || 'Responsável Legal';
  const user = await resolveGuardianUser(sessionUser, targetName, targetCpf);
  if (!user) return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Identificação necessária.' }, { status: 401 });
  if (invite.player.userId === user.id) {
    return NextResponse.json({ error: 'SELF_GUARDIAN_PROHIBITED', message: 'O atleta não pode ser seu próprio responsável.' }, { status: 403 });
  }

  const ipHash = Buffer.from(request.headers.get('x-forwarded-for') || 'local').toString('base64');
  const now = new Date();
  const verificationLevel = crossCheck.isPreValidated ? 'N2_PRE_VALIDADO' : 'N1_CONVITE';

  await prisma.$transaction(async (tx) => {
    await tx.guardianInvite.update({ where: { id: invite.id }, data: { usedAt: now, guardianUserId: user.id } });
    await tx.guardianLink.create({
      data: { guardianUserId: user.id, playerId: invite.playerId, relation: relationship, status: 'ACTIVE', confirmedAt: now, verificationLevel },
    });
    for (const purpose of purposes) {
      await tx.consentRecord.create({ data: { guardianUserId: user.id, playerId: invite.playerId, purpose, termsVersion, grantedAt: now, ipHash } });
      await tx.consentEvent.create({ data: { playerId: invite.playerId, guardianUserId: user.id, purpose, action: 'GRANT', termsVersion, contentHash, ipHash, inviteId: invite.id, verificationLevel } });
    }
    await tx.auditLog.create({
      data: {
        actorUserId: user.id, action: 'GUARDIAN_INVITE_ACCEPTED', resourceType: 'GuardianInvite',
        resourceId: invite.id, meta: { playerId: invite.playerId, relationship, purposes, termsVersion, guardianName, guardianCpfMasked: crossCheck.cleanedCpf ? '***' : null, verificationLevel }, ipHash,
      },
    });
  });

  return NextResponse.json({ ok: true, message: 'Vínculo de tutela e autorizações confirmadas com sucesso.' });
}
