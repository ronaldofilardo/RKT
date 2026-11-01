import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { linkExistingCoach } from './coaches-link.logic';

export interface CoachInput {
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
  linkExisting?: boolean;
}

export async function createCoach(ctId: string, issuedByUserId: string, input: CoachInput) {
  const { name, cpf, birthDate, email, linkExisting } = input;
  const normalizedCpf = cpf.replace(/\D/g, '');

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ cpf: normalizedCpf }, { email: email.toLowerCase() }] },
  });

  if (existingUser) {
    if (existingUser.cpf && existingUser.cpf !== normalizedCpf) {
      return { error: 'CONFLICT', message: 'E-mail já cadastrado para outro CPF', status: 409 } as const;
    }
    if (!linkExisting) {
      return {
        error: 'CONFLICT',
        message: 'CPF ou e-mail já cadastrado',
        status: 409,
        canLinkExisting: true,
        existingUserName: existingUser.name,
      } as const;
    }
    return linkExistingCoach(ctId, issuedByUserId, existingUser);
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
    isExistingUser: false as const,
    tempPassword,
    linkExpiresAt: tempExpiresAt,
  } as const;
}
