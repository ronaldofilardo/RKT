/**
 * Vincula uma conta já existente no RKT a um atleta do CT
 * (equivalente a `linkExistingCoach` para treinadores).
 */

import { prisma } from '@/lib/prisma';
import { invalidateActor } from '@/services/accessService';

export interface AthleteLinkError {
  error: 'CONFLICT';
  message: string;
  status: 409;
}

export async function linkExistingAthleteAccount(input: {
  ctId: string;
  issuedByUserId: string;
  existingUser: { id: string; name: string; email?: string | null; cpf?: string | null };
  /** Player já existente a ser vinculado (ex.: atleta do clube sem conta de acesso). */
  playerId?: string;
  /** Dados do formulário, usados só quando for preciso criar o Player da conta. */
  athlete?: { birthDate: string; gender: string; laterality: string };
}): Promise<
  | { ok: true; userId: string; playerId: string; isExistingUser: true }
  | AthleteLinkError
> {
  const { ctId, issuedByUserId, existingUser, playerId, athlete } = input;

  // Conta única por atleta (Player.userId é único): não sobrescreve vínculo de outro Player.
  const ownedByOther = await prisma.player.findFirst({
    where: { userId: existingUser.id, ...(playerId ? { id: { not: playerId } } : {}) },
    select: { id: true },
  });
  if (ownedByOther) {
    return { error: 'CONFLICT', message: 'Esta conta já está vinculada a outro atleta.', status: 409 };
  }

  const linkedPlayerId = await prisma.$transaction(async (tx) => {
    let pid = playerId ?? null;

    if (!pid) {
      const ownPlayer = await tx.player.findFirst({ where: { userId: existingUser.id }, select: { id: true } });
      if (ownPlayer) {
        pid = ownPlayer.id;
      } else {
        const created = await tx.player.create({
          data: {
            name: existingUser.name,
            email: existingUser.email ?? null,
            cpf: existingUser.cpf ?? null,
            birthDate: athlete ? new Date(athlete.birthDate) : null,
            gender: athlete?.gender,
            dominance: athlete?.laterality,
            userId: existingUser.id,
            createdByUserId: issuedByUserId,
            identityStatus: 'CONFIRMED',
          },
          select: { id: true },
        });
        pid = created.id;
      }
    } else {
      await tx.player.update({
        where: { id: pid },
        data: { userId: existingUser.id, identityStatus: 'CONFIRMED' },
      });
    }

    // O atleta cadastrado pelo clube pertence ao clube: vínculo nasce/re-nasce ACTIVE.
    const pct = await tx.playerCT.findFirst({ where: { playerId: pid, ctId }, select: { id: true } });
    if (pct) {
      await tx.playerCT.update({ where: { id: pct.id }, data: { status: 'ACTIVE', endedAt: null } });
    } else {
      await tx.playerCT.create({ data: { playerId: pid, ctId, status: 'ACTIVE' } });
    }

    const coaches = await tx.membership.findMany({
      where: { ctId, kind: 'TREINADOR', status: 'ACTIVE' },
      select: { userId: true },
    });
    await tx.coachAthleteLink.createMany({
      data: coaches.map((c) => ({ coachUserId: c.userId, playerId: pid, status: 'ACTIVE' })),
      skipDuplicates: true,
    });

    return pid;
  });

  await prisma.auditLog
    .create({
      data: {
        actorUserId: issuedByUserId,
        action: 'ATHLETE_LINKED_TO_CT',
        resourceType: 'Player',
        resourceId: linkedPlayerId,
        ctId,
        meta: { userId: existingUser.id },
      },
    })
    .catch(() => null);

  invalidateActor(existingUser.id);

  return { ok: true, userId: existingUser.id, playerId: linkedPlayerId, isExistingUser: true };
}
