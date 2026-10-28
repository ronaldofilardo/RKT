/**
 * Lógica de negócio para criação de atleta via gestor.
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function createAthleteByGestor(data: {
  name: string;
  cpf: string;
  birthDate: string;
  email?: string | undefined;
  gender: string;
  laterality: string;
  ctId: string;
  issuedByUserId?: string;
}) {
  const { name, cpf, birthDate, email, gender, laterality, ctId, issuedByUserId = '' } = data;
  const normalizedCpf = cpf.replace(/\D/g, '');

  const existingUser = await prisma.user.findUnique({ where: { cpf: normalizedCpf } });
  if (existingUser) {
    return {
      conflict: true,
      message: 'Este atleta já possui cadastro no RKT. Deseja enviar um convite de vínculo com seu clube?',
      inviteKind: 'ATLETA',
    };
  }

  const tempPassword = birthDate.replace(/\D/g, '').slice(0, 8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const tempExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
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
        contactHint: email || cpf,
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
      data: coaches.map((c) => ({
        coachUserId: c.userId,
        playerId: player.id,
        status: 'ACTIVE',
      })),
      skipDuplicates: true,
    });

    return { user, player };
  });

  return {
    conflict: false,
    userId: result.user.id,
    playerId: result.player.id,
    tempPassword,
    linkExpiresAt: tempExpiresAt,
  };
}
