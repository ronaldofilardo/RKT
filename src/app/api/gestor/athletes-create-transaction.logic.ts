import { prisma } from '@/lib/prisma';

/**
 * Transação de criação de conta + atleta do gestor: `User`, `Player`, vínculo
 * `PlayerCT` ACTIVE, reset de senha e propagação automática para os
 * treinadores ativos do CT.
 */
export async function createGestorAthleteTransaction(data: {
  name: string;
  normalizedCpf: string;
  /** CPF como recebido (usado no `contactHint` do reset de senha). */
  rawCpf: string;
  email?: string | undefined;
  birthDate: string;
  gender: string;
  laterality: string;
  ctId: string;
  issuedByUserId: string;
  passwordHash: string;
  tempExpiresAt: Date;
}) {
  const { name, normalizedCpf, rawCpf, email, birthDate, gender, laterality, ctId, issuedByUserId, passwordHash, tempExpiresAt } = data;

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

    const player = await tx.player.create({
      data: {
        name,
        email: email?.toLowerCase() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        dominance: laterality,
        userId: user.id,
        createdByUserId: user.id,
      },
    });

    await tx.playerCT.create({
      data: { playerId: player.id, ctId, status: 'ACTIVE' },
    });

    await tx.passwordResetRequest.create({
      data: {
        userId: user.id,
        status: 'LINK_ISSUED',
        contactHint: email || rawCpf,
        tokenExpiresAt: tempExpiresAt,
        issuedByUserId,
      },
    });

    // Propaga o atleta para todos os treinadores do CT (links ativos automáticos)
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
