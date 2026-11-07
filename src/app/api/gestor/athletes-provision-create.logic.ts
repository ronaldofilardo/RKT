import { prisma } from '@/lib/prisma';
import type { AthleteAccountResult, AthleteAccountError } from './athletes-provision.logic';

/**
 * Cria a conta de acesso provisória do atleta e vincula ao `Player`.
 * Corrida com cadastro simultâneo do mesmo CPF/e-mail vira conflito (P2002).
 */
export async function createProvisionedAthleteAccount(input: {
  playerId: string;
  playerName: string;
  email: string;
  cpf: string;
  passwordHash: string;
  expiresAt: Date;
}): Promise<AthleteAccountResult | AthleteAccountError> {
  const { playerId, playerName, email, cpf, passwordHash, expiresAt } = input;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: playerName,
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
        where: { id: playerId },
        data: { userId: user.id, identityStatus: 'CONFIRMED' },
      });

      return user;
    });

    return { ok: true, userId: created.id, email: created.email };
  } catch (error) {
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
