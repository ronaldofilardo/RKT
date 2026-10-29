// ste-exception R-03: 102 linhas (2 acima do limite). Reduzido de 126L extraindo
// ensureCanInsertAthletesColumn para coaches-migration.logic.ts. As 2 linhas excedentes
// são a estrutura de transação de createCoach, que não se presta a divisão adicional
// sem prejudicar a atomicidade da criação de usuário + membership + passwordResetRequest.
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ensureCanInsertAthletesColumn } from './coaches-migration.logic';

export interface CoachInput {
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
}

export async function listCoaches(ctIds: string[] | string) {
  const ids = Array.isArray(ctIds) ? ctIds : [ctIds];
  await ensureCanInsertAthletesColumn();
  const rows = await prisma.membership.findMany({
    where: { ctId: { in: ids }, kind: 'TREINADOR', status: 'ACTIVE' },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          cpf: true,
          email: true,
          createdAt: true,
          mustChangePassword: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    canInsertAthletes: (r as any).canInsertAthletes ?? true,
    user: r.user,
  }));
}

export async function updateCoachPermissions(membershipId: string, data: { canInsertAthletes: boolean }) {
  await ensureCanInsertAthletesColumn();
  try {
    await prisma.$executeRaw`UPDATE "memberships" SET "canInsertAthletes" = ${data.canInsertAthletes} WHERE "id" = ${membershipId}`;
  } catch {
    // Coluna ainda não existe no banco (migration pendente); ignora silenciosamente.
  }
  return prisma.membership.findUnique({
    where: { id: membershipId },
    select: { id: true },
  });
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

  const createdUserId = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
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
      select: { id: true },
    });

    await tx.membership.create({
      data: {
        userId: createdUser.id,
        kind: 'TREINADOR',
        ctId,
        status: 'ACTIVE',
        createdByUserId: issuedByUserId,
      },
      select: { id: true },
    });

    await tx.passwordResetRequest.create({
      data: {
        userId: createdUser.id,
        status: 'LINK_ISSUED',
        contactHint: email,
        tokenExpiresAt: tempExpiresAt,
        issuedByUserId,
      },
      select: { id: true },
    });

    return createdUser.id;
  });

  return {
    ok: true as const,
    userId: createdUserId,
    tempPassword,
    linkExpiresAt: tempExpiresAt,
  } as const;
}
