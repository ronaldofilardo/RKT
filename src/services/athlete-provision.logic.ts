import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface EnsureAthleteUserParams {
  playerId: string;
  name: string;
  email?: string | null;
  cpf?: string | null;
  birthDate?: Date | null;
  birthYear?: number | null;
  athleteCode?: string | null;
  ctId?: string | null;
}

export async function ensureAthleteUserAccount(
  input: EnsureAthleteUserParams
): Promise<{ userId: string; isNewUser: boolean }> {
  const { playerId, name, birthDate, birthYear, athleteCode } = input;
  const normalizedCpf = input.cpf ? input.cpf.replace(/\D/g, '') : null;
  const rawEmail = input.email ? input.email.trim().toLowerCase() : null;

  const existingPlayer = await prisma.player.findUnique({
    where: { id: playerId },
    select: { userId: true },
  });
  if (existingPlayer?.userId) {
    return { userId: existingPlayer.userId, isNewUser: false };
  }

  let existingUser = null;
  if (normalizedCpf && normalizedCpf.length === 11) {
    existingUser = await prisma.user.findUnique({ where: { cpf: normalizedCpf } });
  }
  if (!existingUser && rawEmail) {
    existingUser = await prisma.user.findUnique({ where: { email: rawEmail } });
  }

  if (existingUser) {
    await prisma.player.update({
      where: { id: playerId },
      data: { userId: existingUser.id, identityStatus: 'CONFIRMED' },
    });
    return { userId: existingUser.id, isNewUser: false };
  }

  const userEmail = rawEmail || (normalizedCpf ? `${normalizedCpf}@local` : `${athleteCode || playerId}@atleta.rkt`);
  const userCpf = normalizedCpf && normalizedCpf.length === 11 ? normalizedCpf : `PROV_${playerId}`;
  const tempPassword = birthDate
    ? birthDate.toISOString().slice(0, 10).replace(/-/g, '')
    : birthYear
    ? `${birthYear}0101`
    : 'rkt12345';
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: userEmail,
      cpf: userCpf,
      passwordHash,
      role: 'ANNOTATOR',
      canOperate: true,
      mustChangePassword: true,
      tempPasswordExpiresAt: expiresAt,
    },
    select: { id: true },
  });

  await prisma.player.update({
    where: { id: playerId },
    data: { userId: newUser.id, identityStatus: 'CONFIRMED' },
  });

  return { userId: newUser.id, isNewUser: true };
}
