import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rankings } from '@/schemas/contracts';

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
}) {
  return prisma.player.update({
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
    },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true },
  });
}

export async function deletePlayer(id: string) {
  return prisma.player.delete({
    where: { id },
  });
}
