/**
 * Lógica de negócio para criação de atleta via gestor.
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { linkExistingAthleteAccount } from './athletes-link.logic';
import { createGestorAthleteTransaction } from './athletes-create-transaction.logic';

export async function createAthleteByGestor(data: {
  name: string;
  cpf: string;
  birthDate: string;
  email?: string | undefined;
  gender: string;
  laterality: string;
  ctId: string;
  issuedByUserId?: string;
  linkExisting?: boolean;
}) {
  const { name, cpf, birthDate, email, gender, laterality, ctId, issuedByUserId = '', linkExisting } = data;
  const normalizedCpf = cpf.replace(/\D/g, '');

  const existingUser = await prisma.user.findUnique({ where: { cpf: normalizedCpf } });
  if (existingUser) {
    if (!linkExisting) {
      return {
        conflict: true,
        canLinkExisting: true,
        existingUserName: existingUser.name,
        message: 'Este atleta já possui cadastro no RKT. Deseja vincular a conta ao seu clube?',
        inviteKind: 'ATLETA',
      };
    }

    // O atleta cadastrado pelo clube pertence ao clube: a conta existente é
    // associada ao elenco (Player + PlayerCT ACTIVE) em vez de duplicar cadastro.
    const linked = await linkExistingAthleteAccount({
      ctId,
      issuedByUserId,
      existingUser: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        cpf: existingUser.cpf,
      },
      athlete: { birthDate, gender, laterality },
    });
    if ('error' in linked) {
      return { conflict: true, message: linked.message, inviteKind: 'ATLETA' };
    }
    return { conflict: false, isExistingUser: true, userId: linked.userId, playerId: linked.playerId };
  }

  const tempPassword = birthDate.replace(/\D/g, '').slice(0, 8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const tempExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const result = await createGestorAthleteTransaction({
    name, normalizedCpf, rawCpf: cpf, email, birthDate, gender, laterality,
    ctId, issuedByUserId, passwordHash, tempExpiresAt,
  });

  return {
    conflict: false,
    userId: result.user.id,
    playerId: result.player.id,
    tempPassword,
    linkExpiresAt: tempExpiresAt,
  };
}
