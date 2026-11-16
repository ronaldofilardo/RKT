import { prisma } from '@/lib/prisma';

export async function simulateGuardianConsent(input: {
  ctId: string;
  playerId: string;
  managerUserId: string;
}) {
  const { ctId, playerId, managerUserId } = input;
  const now = new Date();

  const invite = await prisma.guardianInvite.findFirst({
    where: { playerId, ctId },
    orderBy: { createdAt: 'desc' },
  });

  const guardianName = invite?.preGuardianName || 'Responsável Legal';
  const guardianCpf = invite?.preGuardianCpf || null;
  const email = guardianCpf ? `${guardianCpf}@responsavel.local` : `resp_${playerId}@responsavel.local`;

  let guardianUser = guardianCpf
    ? await prisma.user.findUnique({ where: { cpf: guardianCpf } })
    : null;

  if (!guardianUser) {
    guardianUser = await prisma.user.create({
      data: {
        name: guardianName,
        email,
        cpf: guardianCpf || `SIM_${playerId}`,
        passwordHash: '$2a$10$placeholderSimulatedPasswordHash',
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    if (invite) {
      await tx.guardianInvite.update({
        where: { id: invite.id },
        data: { usedAt: now, guardianUserId: guardianUser.id },
      });
    }

    const existingLink = await tx.guardianLink.findFirst({
      where: { playerId, guardianUserId: guardianUser.id },
    });

    if (existingLink) {
      await tx.guardianLink.update({
        where: { id: existingLink.id },
        data: { status: 'ACTIVE', confirmedAt: now, revokedAt: null },
      });
    } else {
      await tx.guardianLink.create({
        data: {
          guardianUserId: guardianUser.id,
          playerId,
          relation: 'RESPONSAVEL_LEGAL',
          status: 'ACTIVE',
          confirmedAt: now,
          verificationLevel: 'SIMULADO_GESTOR',
        },
      });
    }

    await tx.consentRecord.create({
      data: {
        guardianUserId: guardianUser.id,
        playerId,
        purpose: 'DATA',
        termsVersion: '1.0',
        grantedAt: now,
      },
    });

    await tx.player.update({
      where: { id: playerId },
      data: { guardianGate: 'LIBERADO' },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: managerUserId,
        action: 'GUARDIAN_CONSENT_SIMULATED',
        resourceType: 'Player',
        resourceId: playerId,
        meta: { simulated: true, guardianUserId: guardianUser.id },
      },
    });
  });

  return { ok: true, isConsented: true };
}
