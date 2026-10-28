import { prisma } from '@/lib/prisma';
import { hashCpf } from '@/core/athlete/cpf';
import { isMinor } from '@/core/access/age';

const PEPPER = process.env.CPF_HASH_PEPPER ?? '';

export type ClaimResult =
  | { kind: 'claimed'; playerId: string }
  | { kind: 'blocked-minor'; playerId: string }
  | { kind: 'created'; playerId: string };

export async function handleSignupPlayerClaim({
  userId,
  name,
  email,
  cpfRaw,
  birthDate,
}: {
  userId: string;
  name: string;
  email: string | null;
  cpfRaw?: string | null;
  birthDate: Date | null;
}): Promise<ClaimResult> {
  if (!cpfRaw || !birthDate) {
    const player = await prisma.player.create({
      data: {
        name,
        email,
        userId,
        createdByUserId: userId,
        identityStatus: 'CONFIRMED',
      },
      select: { id: true },
    });
    return { kind: 'created', playerId: player.id };
  }

  const cpfHash = hashCpf(cpfRaw, PEPPER);
  const provisional = await prisma.player.findFirst({
    where: {
      identityStatus: 'PROVISIONAL',
      userId: null,
      cpfHash,
      birthDate,
    },
    select: { id: true, cpfLast2: true },
  });

  if (provisional && !isMinor(birthDate, new Date())) {
    await prisma.player.update({
      where: { id: provisional.id },
      data: { userId, identityStatus: 'CONFIRMED' },
    });
    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'PLAYER_CLAIM_AUTO',
        resourceType: 'Player',
        resourceId: provisional.id,
        meta: { cpfLast2: provisional.cpfLast2 ?? null },
      },
    });
    return { kind: 'claimed', playerId: provisional.id };
  }

  if (provisional && isMinor(birthDate, new Date())) {
    const player = await prisma.player.create({
      data: { name, email, userId, createdByUserId: userId, identityStatus: 'CONFIRMED' },
      select: { id: true },
    });
    return { kind: 'blocked-minor', playerId: player.id };
  }

  const player = await prisma.player.create({
    data: { name, email, userId, createdByUserId: userId, identityStatus: 'CONFIRMED' },
    select: { id: true },
  });
  return { kind: 'created', playerId: player.id };
}
