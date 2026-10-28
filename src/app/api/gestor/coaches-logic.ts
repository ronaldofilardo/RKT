import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface CoachInput {
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
}

export async function listCoaches(ctId: string) {
  const rows = await prisma.membership.findMany({
    where: { ctId, kind: 'TREINADOR', status: 'ACTIVE' },
    include: { user: { select: { id: true, name: true, cpf: true, email: true, createdAt: true, mustChangePassword: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    canInsertAthletes: (r as any).canInsertAthletes ?? true,
    user: r.user,
  }));
}

export async function updateCoachPermissions(membershipId: string, data: { canInsertAthletes: boolean }) {
  await prisma.$executeRaw`UPDATE "memberships" SET "canInsertAthletes" = ${data.canInsertAthletes} WHERE "id" = ${membershipId}`;
  return prisma.membership.findUnique({ where: { id: membershipId } });
}

export async function createCoach(ctId: string, issuedByUserId: string, input: CoachInput) {
  const { name, cpf, birthDate, email } = input;
  const normalizedCpf = cpf.replace(/\D/g, '');

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ cpf: normalizedCpf }, { email: email.toLowerCase() }] },
  });
  if (existingUser) {
    return { error: 'CONFLICT', message: 'CPF ou e-mail já cadastrado', status: 409 } as const;
  }

  const tempPassword = birthDate.replace(/\D/g, '').slice(0, 8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const tempExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const createdUser = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      cpf: normalizedCpf,
      passwordHash,
      role: 'ANNOTATOR',
      canOperate: true,
      mustChangePassword: true,
      tempPasswordExpiresAt: tempExpiresAt,
    },
  });

  await prisma.membership.create({
    data: { userId: createdUser.id, kind: 'TREINADOR', ctId, status: 'ACTIVE' },
  });

  await prisma.passwordResetRequest.create({
    data: {
      userId: createdUser.id,
      status: 'LINK_ISSUED',
      contactHint: email,
      tokenExpiresAt: tempExpiresAt,
      issuedByUserId,
    },
  });

  return {
    ok: true as const,
    userId: createdUser.id,
    tempPassword,
    linkExpiresAt: tempExpiresAt,
  } as const;
}
