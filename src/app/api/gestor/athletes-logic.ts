import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { isMinor } from '@/core/access/age';
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
  guardianName?: string;
  guardianCpf?: string;
  guardianPhone?: string;
  guardianContact?: string;
}) {
  const { name, cpf, birthDate, email, gender, laterality, ctId, issuedByUserId = '', linkExisting } = data;
  const normalizedCpf = cpf.replace(/\D/g, '');

  const existingUser = await prisma.user.findUnique({ where: { cpf: normalizedCpf } });
  if (existingUser) {
    if (!linkExisting) {
      return {
        conflict: true, canLinkExisting: true, existingUserName: existingUser.name,
        message: 'Este atleta já possui cadastro no RKT. Deseja vincular a conta ao seu clube?',
        inviteKind: 'ATLETA',
      };
    }

    const linked = await linkExistingAthleteAccount({
      ctId, issuedByUserId,
      existingUser: { id: existingUser.id, name: existingUser.name, email: existingUser.email, cpf: existingUser.cpf },
      athlete: { birthDate, gender, laterality },
    });
    if ('error' in linked) return { conflict: true, message: linked.message, inviteKind: 'ATLETA' };
    return { conflict: false, isExistingUser: true, userId: linked.userId, playerId: linked.playerId };
  }

  const tempPassword = birthDate.replace(/\D/g, '').slice(0, 8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const tempExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const minor = isMinor(new Date(birthDate), new Date());

  let guardianNoticeToken: string | undefined;
  let guardianData: any;
  if (minor) {
    guardianNoticeToken = randomBytes(24).toString('base64url');
    const noticeTokenHash = createHash('sha256').update(guardianNoticeToken).digest('hex');
    const inviteCode = Math.floor(100000 + Math.random() * 900000).toString();
    const inviteCodeHash = createHash('sha256').update(inviteCode).digest('hex');
    guardianData = {
      guardianName: data.guardianName, guardianCpf: data.guardianCpf,
      guardianPhone: data.guardianPhone, guardianContact: data.guardianContact,
      noticeTokenHash, inviteCodeHash,
    };
  }

  const result = await createGestorAthleteTransaction({
    name, normalizedCpf, rawCpf: cpf, email, birthDate, gender, laterality,
    ctId, issuedByUserId, passwordHash, tempExpiresAt, guardianData,
  });

  return {
    conflict: false, userId: result.user.id, playerId: result.player.id,
    tempPassword, linkExpiresAt: tempExpiresAt, isMinor: minor,
    guardianNoticeToken, guardianName: data.guardianName,
  };
}
