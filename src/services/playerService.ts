import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rankings } from '@/schemas/contracts';

export async function listPlayers(cursor?: string | null, limit = 20, userId?: string | null) {
  return prisma.player.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: userId ? { createdByUserId: userId } : {},
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
    orderBy: { name: 'asc' },
  });
}

export async function findPlayerByEmail(email: string) {
  return prisma.player.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, passwordHash: true },
  });
}

export async function getPlayerById(id: string) {
  return prisma.player.findUnique({
    where: { id },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, createdByUserId: true },
  });
}

export async function updatePlayer(id: string, data: {
  name?: string;
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
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.age !== undefined && { age: data.age }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
      ...(data.dominance !== undefined && { dominance: data.dominance }),
      ...(data.backhand !== undefined && { backhand: data.backhand }),
      ...(data.ranking !== undefined && { ranking: data.ranking }),
      ...(data.rankings !== undefined && { rankings: data.rankings as unknown as Prisma.InputJsonValue }),
    },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
  });
}

export async function createPlayer(data: {
  name: string;
  email?: string;
  passwordHash?: string;
  gender?: string;
  age?: number;
  birthDate?: Date;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Rankings;
  createdByUserId?: string;
}) {
  return prisma.player.create({
    data: {
      name: data.name,
      email: data.email ?? `temp_${Date.now()}@placeholder.local`,
      passwordHash: data.passwordHash ?? 'PLACEHOLDER',
      gender: data.gender,
      age: data.age,
      birthDate: data.birthDate,
      dominance: data.dominance,
      backhand: data.backhand,
      ranking: data.ranking,
      rankings: data.rankings as unknown as Prisma.InputJsonValue,
      createdByUserId: data.createdByUserId,
    },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
  });
}
