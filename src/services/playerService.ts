import { prisma } from '@/lib/prisma';

export async function listPlayers(cursor?: string | null, limit = 20) {
  return prisma.player.findMany({
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: { id: true, name: true, gender: true, age: true, dominance: true, backhand: true, ranking: true },
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
  dominance?: string;
  backhand?: string;
  ranking?: number;
}) {
  return prisma.player.create({
    data: {
      name: data.name,
      email: data.email ?? `temp_${Date.now()}@placeholder.local`,
      passwordHash: data.passwordHash ?? 'PLACEHOLDER',
      gender: data.gender,
      age: data.age,
      dominance: data.dominance,
      backhand: data.backhand,
      ranking: data.ranking,
    },
    select: { id: true, name: true, gender: true, age: true, dominance: true, backhand: true, ranking: true },
  });
}
