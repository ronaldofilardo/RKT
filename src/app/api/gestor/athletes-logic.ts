import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { isMinor } from '@/core/access/age';
import { checkAthleteExistingAccount } from './athletes-account-check.logic';
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

  const check = await checkAthleteExistingAccount(normalizedCpf);
  if (check.kind !== 'NONE') {
    if (check.kind === 'GUARDIAN_USER') {
      return { conflict: true, canLinkExisting: false, existingUserName: check.name, message: check.message, inviteKind: 'ATLETA', accountKind: check.kind };
    }
    if (!linkExisting) {
      return { conflict: true, canLinkExisting: true, existingUserName: check.name, guardianName: check.guardianName, message: check.message, inviteKind: 'ATLETA', accountKind: check.kind, statusToApply: check.statusToApply };
    }
    if (check.kind === 'DEPENDENT_PLAYER_WITHOUT_USER' && check.existingPlayerId) {
      const pid = check.existingPlayerId;
      const pct = await prisma.playerCT.findFirst({ where: { playerId: pid, ctId } });
      if (pct) await prisma.playerCT.update({ where: { id: pct.id }, data: { status: 'PENDING', endedAt: null } });
      else await prisma.playerCT.create({ data: { playerId: pid, ctId, status: 'PENDING' } });
      return { conflict: false, isExistingUser: false, playerId: pid, isMinor: true };
    }
    if (check.existingUserId) {
      const linked = await linkExistingAthleteAccount({
        ctId, issuedByUserId, statusToApply: check.statusToApply,
        existingUser: { id: check.existingUserId, name: check.name, cpf: normalizedCpf },
        athlete: { birthDate, gender, laterality },
      });
      if ('error' in linked) return { conflict: true, message: linked.message, inviteKind: 'ATLETA' };
      return { conflict: false, isExistingUser: true, userId: linked.userId, playerId: linked.playerId, isMinor: check.statusToApply === 'PENDING' };
    }
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
