import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const ActivateSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres.'),
  accessMode: z.enum(['BASIC', 'SPECTATOR']).default('BASIC'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const invite = await prisma.guardianInvite.findUnique({
    where: { tokenHash },
    include: {
      guardianUser: { select: { id: true, name: true, cpf: true } },
    },
  });

  if (!invite || invite.revokedAt) {
    return NextResponse.json({ error: 'INVALID_INVITE', message: 'Link inválido ou revogado.' }, { status: 404 });
  }
  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ error: 'EXPIRED_INVITE', message: 'Este link expirou.' }, { status: 410 });
  }

  let guardianUser = invite.guardianUser;
  if (!guardianUser && invite.preGuardianCpf) {
    guardianUser = await prisma.user.findUnique({
      where: { cpf: invite.preGuardianCpf.replace(/\D/g, '') },
      select: { id: true, name: true, cpf: true },
    });
  }

  if (!guardianUser) {
    return NextResponse.json(
      { error: 'GUARDIAN_NOT_FOUND', message: 'A conta do responsável não foi localizada para ativação.' },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = ActivateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
  }

  const { password, accessMode } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const canOperate = accessMode === 'SPECTATOR';

  await prisma.user.update({
    where: { id: guardianUser.id },
    data: { passwordHash, canOperate, mustChangePassword: false },
  });

  const ipHash = Buffer.from(request.headers.get('x-forwarded-for') || 'local').toString('base64');
  await prisma.auditLog.create({
    data: {
      actorUserId: guardianUser.id,
      action: 'GUARDIAN_ACCOUNT_ACTIVATED',
      resourceType: 'User',
      resourceId: guardianUser.id,
      meta: { accessMode, canOperate, inviteId: invite.id },
      ipHash,
    },
  });

  return NextResponse.json({
    ok: true,
    accessMode,
    canOperate,
    message: 'Conta ativada com sucesso. Você já pode fazer login no sistema.',
  });
}
