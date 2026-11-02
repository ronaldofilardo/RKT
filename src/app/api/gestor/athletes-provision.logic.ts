/**
 * Conta de acesso de um atleta já vinculado ao CT, usada pelo "Link Senha".
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { linkExistingAthleteAccount } from './athletes-link.logic';

export interface AthleteAccountResult {
  ok: true;
  userId: string;
  email: string | null;
}

export interface AthleteAccountError {
  ok: false;
  error: 'VALIDATION_ERROR' | 'CONFLICT';
  message: string;
  status: 400 | 409;
}

/**
 * Garante que o atleta do CT tenha conta de acesso antes de emitir o link:
 * - sem conta, cria o `User` (senha provisória = data de nascimento, padrão do
 *   cadastro pelo gestor) e associa ao `Player`;
 * - com conta de mesmo CPF, vincula a conta existente ao atleta.
 */
export async function provisionAthleteAccount(input: {
  ctId: string;
  issuedByUserId: string;
  player: {
    id: string;
    name: string;
    email?: string | null;
    cpf?: string | null;
    birthDate?: Date | null;
  };
}): Promise<AthleteAccountResult | AthleteAccountError> {
  const { ctId, issuedByUserId, player } = input;

  const cpf = player.cpf?.replace(/\D/g, '') ?? '';
  if (cpf.length !== 11) {
    return {
      ok: false,
      error: 'VALIDATION_ERROR',
      message: 'Informe o CPF do atleta em "Editar" antes de gerar o link de senha.',
      status: 400,
    };
  }
  if (!player.birthDate) {
    return {
      ok: false,
      error: 'VALIDATION_ERROR',
      message: 'Informe a data de nascimento do atleta em "Editar" antes de gerar o link de senha.',
      status: 400,
    };
  }

  const email = (player.email || `${cpf}@local`).toLowerCase();
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ cpf }, { email }] },
    select: { id: true, name: true, email: true, cpf: true },
  });

  if (existingUser) {
    // CPF é a chave de identidade: mesmo CPF = mesma pessoa -> vincula a conta.
    if (existingUser.cpf !== cpf) {
      return {
        ok: false,
        error: 'CONFLICT',
        message: 'Este e-mail pertence a outra conta. Ajuste os dados do atleta em "Editar" antes de gerar o link de senha.',
        status: 409,
      };
    }
    const linked = await linkExistingAthleteAccount({
      ctId,
      issuedByUserId,
      existingUser,
      playerId: player.id,
    });
    if ('error' in linked) {
      return { ok: false, error: linked.error, message: linked.message, status: linked.status };
    }
    return { ok: true, userId: linked.userId, email: existingUser.email ?? email };
  }

  // Mesmo formato do cadastro pelo gestor: YYYYMMDD a partir da data armazenada.
  const tempPassword = player.birthDate.toISOString().slice(0, 10).replace(/-/g, '');
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: player.name,
          email,
          cpf,
          passwordHash,
          role: 'ANNOTATOR',
          canOperate: true,
          mustChangePassword: true,
          tempPasswordExpiresAt: expiresAt,
        },
        select: { id: true, email: true },
      });

      await tx.player.update({
        where: { id: player.id },
        data: { userId: user.id, identityStatus: 'CONFIRMED' },
      });

      return user;
    });

    return { ok: true, userId: created.id, email: created.email };
  } catch (error) {
    // Corrida com um cadastro simultâneo do mesmo CPF/e-mail: trata como conflito.
    if ((error as { code?: string })?.code === 'P2002') {
      return {
        ok: false,
        error: 'CONFLICT',
        message: 'Já existe uma conta com este CPF ou e-mail. Atualize a lista e tente novamente.',
        status: 409,
      };
    }
    throw error;
  }
}
