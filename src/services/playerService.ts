import { prisma } from '@/lib/prisma';

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
  rankings?: Record<string, number>;
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
      rankings: data.rankings,
      createdByUserId: data.createdByUserId,
    },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true },
  });
}
