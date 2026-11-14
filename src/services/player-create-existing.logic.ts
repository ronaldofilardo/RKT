import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ConflictError } from '@/lib/errors';
import { handlePlayerPostCreate } from './player-create-links.logic';

export interface ResolveExistingPlayerInput {
  nickname: string;
  data: {
    name: string;
    gender?: string;
    birthDate?: Date;
    dominance?: string;
    backhand?: string;
    rankingsPayload: Record<string, unknown>;
    cpf?: string | null;
    cpfHash: string | null;
    cpfLast2: string | null;
    myClub?: boolean;
    ctId?: string | null;
    createdByUserId?: string;
    actorProfile?: 'ATLETA' | 'GESTOR' | 'TREINADOR' | null;
  };
}

export async function tryResolveExistingPlayer(input: ResolveExistingPlayerInput) {
  const { nickname, data } = input;
  const existing = await prisma.player.findFirst({
    where: { nickname },
    select: {
      id: true, name: true, gender: true, age: true, birthDate: true,
      dominance: true, backhand: true, ranking: true, rankings: true,
      club: true, cpfHash: true, cpfLast2: true, identityStatus: true,
      athleteCode: true, nickname: true, poolVisible: true, userId: true,
      createdByUserId: true,
    },
  });
  if (!existing) return null;

  if (data.myClub && data.ctId) {
    const existingPlayerCT = await prisma.playerCT.findFirst({
      where: { playerId: existing.id, ctId: data.ctId },
    });
    if (existingPlayerCT) {
      if (existingPlayerCT.status === 'ACTIVE') {
        throw new ConflictError('Atleta já está cadastrado no elenco do seu clube', { code: 'NICKNAME_TAKEN' });
      }
      await prisma.playerCT.update({
        where: { id: existingPlayerCT.id },
        data: { status: 'ACTIVE', endedAt: null },
      });
    } else {
      await prisma.playerCT.create({
        data: { playerId: existing.id, ctId: data.ctId, status: 'ACTIVE' },
      });
    }

    const updated = await prisma.player.update({
      where: { id: existing.id },
      data: {
        name: data.name || existing.name,
        birthDate: data.birthDate ?? existing.birthDate,
        gender: data.gender ?? existing.gender,
        dominance: data.dominance ?? existing.dominance,
        backhand: data.backhand ?? existing.backhand,
        ...(Object.keys(data.rankingsPayload).length > 0
          ? { rankings: data.rankingsPayload as unknown as Prisma.InputJsonValue }
          : {}),
        ...(data.cpf ? { cpf: data.cpf.replace(/\D/g, ''), cpfHash: data.cpfHash, cpfLast2: data.cpfLast2 } : {}),
      },
      select: {
        id: true, name: true, gender: true, age: true, birthDate: true,
        dominance: true, backhand: true, ranking: true, rankings: true,
        club: true, cpfHash: true, cpfLast2: true, identityStatus: true,
        athleteCode: true, nickname: true, poolVisible: true, userId: true,
        createdByUserId: true,
      },
    });

    await handlePlayerPostCreate({
      player: { ...updated, cpf: data.cpf },
      myClub: data.myClub,
      ctId: data.ctId,
      createdByUserId: data.createdByUserId,
      actorProfile: data.actorProfile,
    });

    return updated;
  }

  throw new ConflictError('Apelido já está em uso', { code: 'NICKNAME_TAKEN' });
}
