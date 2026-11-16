import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const invite = await prisma.guardianInvite.findUnique({
    where: { tokenHash },
    include: {
      player: { select: { id: true, name: true, birthDate: true } },
      ct: { select: { id: true, name: true } },
    },
  });

  if (!invite || invite.revokedAt || invite.usedAt) {
    return NextResponse.json(
      { error: 'INVALID_INVITE', message: 'Este link de autorização é inválido ou já foi utilizado.' },
      { status: 404 },
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: 'EXPIRED_INVITE', message: 'Este link de autorização expirou.' },
      { status: 410 },
    );
  }

  const preGuardianCpfMasked = invite.preGuardianCpf
    ? invite.preGuardianCpf.replace(/(\d{3})\d{6}(\d{2})/, '$1.***.***-$2')
    : null;

  return NextResponse.json({
    ok: true,
    minorName: invite.player.name,
    trainingCenterName: invite.ct?.name ?? 'Centro de Treinamento',
    preGuardianName: invite.preGuardianName ?? null,
    hasPreRegisteredCpf: Boolean(invite.preGuardianCpf),
    preGuardianCpfMasked,
    expiresAt: invite.expiresAt,
  });
}
