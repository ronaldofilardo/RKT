/**
 * Conta de acesso de um atleta já vinculado ao CT, usada pelo "Link Senha".
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { linkExistingAthleteAccount } from './athletes-link.logic';
import { createProvisionedAthleteAccount } from './athletes-provision-create.logic';

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
    return { ok: false, error: 'VALIDATION_ERROR', status: 400, message: 'Informe o CPF do atleta em "Editar" antes de gerar o link de senha.' };
  }
  if (!player.birthDate) {
    return { ok: false, error: 'VALIDATION_ERROR', status: 400, message: 'Informe a data de nascimento do atleta em "Editar" antes de gerar o link de senha.' };
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

  return createProvisionedAthleteAccount({
    playerId: player.id, playerName: player.name,
    email, cpf, passwordHash, expiresAt,
  });
}
