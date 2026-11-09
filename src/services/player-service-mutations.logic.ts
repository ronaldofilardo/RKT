import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rankings } from '@/schemas/contracts';
import { ConflictError, getPrismaErrorCode } from '@/lib/errors';
import { normalizeNickname } from '@/core/athlete/nickname';

export { createPlayer } from './player-create.logic';

export async function updatePlayer(id: string, data: {
  name?: string;
  email?: string;
  club?: string;
  gender?: string;
  age?: number;
  birthDate?: Date;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Rankings;
  nickname?: string | null;
}) {
  try {
    return await prisma.player.update({
      where: { id },
      data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.club !== undefined && { club: data.club }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
      ...(data.dominance !== undefined && { dominance: data.dominance }),
      ...(data.backhand !== undefined && { backhand: data.backhand }),
      ...(data.ranking !== undefined && { ranking: data.ranking }),
      ...(data.rankings !== undefined && { rankings: data.rankings as unknown as Prisma.InputJsonValue }),
      ...(data.nickname !== undefined && {
        nickname: data.nickname ? normalizeNickname(data.nickname) : null,
      }),
      },
      select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, nickname: true },
    });
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw new ConflictError('Apelido já está em uso', { code: 'NICKNAME_TAKEN' });
    }
    throw error;
  }
}

export async function deletePlayer(id: string) {
  return prisma.player.delete({
    where: { id },
  });
}
