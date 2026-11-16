import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';
import { isMinor } from '@/core/access/age';

export interface GuardianPreliminaryInput {
  guardianName?: string;
  guardianCpf?: string;
  guardianPhone?: string;
  guardianContact?: string;
  noticeTokenHash?: string;
  inviteCodeHash?: string;
}

export async function createGestorAthleteTransaction(data: {
  name: string;
  normalizedCpf: string;
  rawCpf: string;
  email?: string | undefined;
  birthDate: string;
  gender: string;
  laterality: string;
  ctId: string;
  issuedByUserId: string;
  passwordHash: string;
  tempExpiresAt: Date;
  guardianData?: GuardianPreliminaryInput;
}) {
  const { name, normalizedCpf, rawCpf, email, birthDate, gender, laterality, ctId, issuedByUserId, passwordHash, tempExpiresAt, guardianData } = data;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email?.toLowerCase() || `${normalizedCpf}@local`,
        cpf: normalizedCpf,
        passwordHash,
        role: 'ANNOTATOR',
        canOperate: true,
        mustChangePassword: true,
        tempPasswordExpiresAt: tempExpiresAt,
      },
    });

    const bDate = birthDate ? new Date(birthDate) : null;
    const guardianGate = isMinor(bDate, new Date()) ? 'AGUARDANDO_RESPONSAVEL' : 'LIBERADO_MAIOR';

    const player = await tx.player.create({
      data: {
        name,
        email: email?.toLowerCase() || null,
        birthDate: bDate,
        gender,
        dominance: laterality,
        userId: user.id,
        createdByUserId: user.id,
        guardianGate,
      },
    });

    await tx.playerCT.create({ data: { playerId: player.id, ctId, status: 'ACTIVE' } });

    await tx.passwordResetRequest.create({
      data: {
        userId: user.id, status: 'LINK_ISSUED', contactHint: email || rawCpf,
        tokenExpiresAt: tempExpiresAt, issuedByUserId,
      },
    });

    if (guardianData?.noticeTokenHash && guardianData.inviteCodeHash) {
      const gCpf = guardianData.guardianCpf ? guardianData.guardianCpf.replace(/\D/g, '') : null;
      const gCpfHash = gCpf ? createHash('sha256').update(gCpf).digest('hex') : null;
      await tx.guardianInvite.create({
        data: {
          playerId: player.id, ctId, createdByUserId: issuedByUserId, createdByKind: 'GESTOR',
          preGuardianName: guardianData.guardianName ?? null,
          preGuardianCpf: gCpf, preGuardianCpfHash: gCpfHash,
          preGuardianPhone: guardianData.guardianPhone ?? null,
          preGuardianContact: guardianData.guardianContact ?? null,
          tokenHash: guardianData.noticeTokenHash, codeHash: guardianData.inviteCodeHash,
          expiresAt: tempExpiresAt,
        },
      });
    }

    const coaches = await tx.membership.findMany({
      where: { ctId, kind: 'TREINADOR', status: 'ACTIVE' },
      select: { userId: true },
    });
    await tx.coachAthleteLink.createMany({
      data: coaches.map((c) => ({ coachUserId: c.userId, playerId: player.id, status: 'ACTIVE' })),
      skipDuplicates: true,
    });

    return { user, player };
  });
}
