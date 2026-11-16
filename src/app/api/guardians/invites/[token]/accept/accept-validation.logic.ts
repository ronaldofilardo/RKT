import { validateCpf } from '@/lib/validators/cpf.validator';
import { prisma } from '@/lib/prisma';

export interface CrossCheckResult {
  ok: boolean;
  error?: string;
  message?: string;
  cleanedCpf: string | null;
  isPreValidated: boolean;
}

export function validateGuardianCrossCheck(
  invite: { preGuardianCpf?: string | null; preGuardianCpfHash?: string | null },
  guardianCpf?: string | null,
): CrossCheckResult {
  if (!guardianCpf || !guardianCpf.trim()) {
    return { ok: true, cleanedCpf: null, isPreValidated: Boolean(invite.preGuardianCpfHash) };
  }

  const cpfValidation = validateCpf(guardianCpf);
  if (!cpfValidation.isValid) {
    return { ok: false, error: 'INVALID_CPF', message: 'CPF informado é inválido.', cleanedCpf: null, isPreValidated: false };
  }

  const cleanedCpf = guardianCpf.replace(/\D/g, '');
  if (invite.preGuardianCpf) {
    const expectedCpf = invite.preGuardianCpf.replace(/\D/g, '');
    if (cleanedCpf !== expectedCpf) {
      return {
        ok: false,
        error: 'CPF_MISMATCH',
        message: 'O CPF informado não confere com o CPF do responsável cadastrado pelo clube.',
        cleanedCpf,
        isPreValidated: false,
      };
    }
    return { ok: true, cleanedCpf, isPreValidated: true };
  }

  return { ok: true, cleanedCpf, isPreValidated: false };
}

export async function resolveGuardianUser(
  sessionUser: { id: string } | null,
  guardianName?: string | null,
  cleanedCpf?: string | null,
) {
  const targetCpf = cleanedCpf?.replace(/\D/g, '') || null;
  if (targetCpf) {
    let user = await prisma.user.findUnique({ where: { cpf: targetCpf } });
    if (!user) {
      const email = `${targetCpf}@responsavel.local`;
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: (guardianName || 'Responsável Legal').trim(),
            cpf: targetCpf,
            email,
            passwordHash: '$2a$10$placeholderGuardianPasswordHashAwaitingSetup',
          },
        });
      }
    }
    return { id: user.id };
  }

  if (sessionUser) return sessionUser;
  return null;
}
