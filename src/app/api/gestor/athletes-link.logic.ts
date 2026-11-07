/**
 * Vincula uma conta já existente no RKT a um atleta do CT
 * (equivalente a `linkExistingCoach` para treinadores).
 */

import { prisma } from '@/lib/prisma';
import { invalidateActor } from '@/services/accessService';
import { resolveLinkedPlayerId } from './athletes-link-player.logic';

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
  const { ctId, issuedByUserId, existingUser, playerId } = input;

  // Conta única por atleta (Player.userId é único): não sobrescreve vínculo de outro Player.
  const ownedByOther = await prisma.player.findFirst({
    where: { userId: existingUser.id, ...(playerId ? { id: { not: playerId } } : {}) },
    select: { id: true },
  });
  if (ownedByOther) {
    return { error: 'CONFLICT', message: 'Esta conta já está vinculada a outro atleta.', status: 409 };
  }

  const linkedPlayerId = await resolveLinkedPlayerId(input);

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
