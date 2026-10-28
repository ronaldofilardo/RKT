import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { GestorSignupInput } from '@/lib/validators/gestor-signup.schema';
import { resolveUniqueSlug } from './signup-gestor-logic';

export async function createGestorClub(input: GestorSignupInput) {
  const {
    cnpj, razaoSocial, nomeFantasia, telefone, email, endereco,
    legalRepName, legalRepCpf, legalRepEmail, legalRepPhone,
    sameAsLegalRep = false, responsibleName, responsibleCpf, responsibleEmail, password,
  } = input;

  const normalizedCnpj = cnpj.replace(/\D/g, '');
  const normalizedResponsibleCpf = (sameAsLegalRep ? legalRepCpf : responsibleCpf ?? '').replace(/\D/g, '');
  const normalizedLegalRepCpf = legalRepCpf.replace(/\D/g, '');
  const responsibleEmailValue = (sameAsLegalRep ? legalRepEmail : responsibleEmail ?? '').toLowerCase();
  const responsibleNameValue = sameAsLegalRep ? legalRepName : (responsibleName ?? '');
  const conflict = await validateGestorClubDuplicates(normalizedCnpj, normalizedResponsibleCpf, normalizedLegalRepCpf, responsibleEmailValue);
  if (conflict) return conflict;
  const slug = await resolveUniqueSlug(prisma, nomeFantasia);
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const ct = await tx.trainingCenter.create({
      data: {
        name: nomeFantasia,
        slug,
        status: 'PENDING',
        cnpj: normalizedCnpj,
        legalName: razaoSocial,
        phone: telefone,
        email: email.toLowerCase(),
        address: endereco as unknown as Prisma.InputJsonValue,
        legalRepName,
        legalRepCpf: normalizedLegalRepCpf,
        legalRepEmail: legalRepEmail.toLowerCase(),
        legalRepPhone,
        createdByUserId: null,
      },
    });

    const user = await tx.user.create({
      data: {
        name: responsibleNameValue,
        email: responsibleEmailValue,
        cpf: normalizedResponsibleCpf,
        passwordHash,
        role: 'ANNOTATOR',
        canOperate: true,
        mustChangePassword: false,
      },
    });

    await tx.membership.create({
      data: { userId: user.id, kind: 'GESTOR', ctId: ct.id, status: 'ACTIVE' },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'CLUBE_CADASTRADO',
        resourceType: 'TrainingCenter',
        resourceId: ct.id,
        ctId: ct.id,
        meta: { cnpj: normalizedCnpj, razaoSocial, nomeFantasia, responsibleEmail: responsibleEmailValue, sameAsLegalRep },
      },
    });

    return { ct, user };
  });

  return { ok: true as const, clubId: result.ct.id, slug: result.ct.slug, status: result.ct.status } as const;
}

async function validateGestorClubDuplicates(
  cnpj: string,
  responsibleCpf: string,
  legalRepCpf: string,
  responsibleEmail: string,
) {
  const existingCnpj = await prisma.trainingCenter.findUnique({ where: { cnpj } });
  if (existingCnpj) {
    return { error: 'CONFLICT', message: 'CNPJ já cadastrado', status: 409 } as const;
  }

  const existingCpf = await prisma.user.findFirst({
    where: { OR: [{ cpf: responsibleCpf }, { cpf: legalRepCpf }] },
  });
  if (existingCpf) {
    return { error: 'CONFLICT', message: 'CPF já cadastrado no sistema', status: 409 } as const;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: responsibleEmail } });
  if (existingEmail) {
    return { error: 'CONFLICT', message: 'E-mail já cadastrado no sistema', status: 409 } as const;
  }

  return null;
}
