import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret');

let createdPlayerIds: string[] = [];
let createdMatchIds: string[] = [];

export async function createTestPlayer(data?: Partial<Prisma.PlayerCreateInput>) {
  const player = await prisma.player.create({
    data: {
      name: `Test Player ${Date.now()}`,
      email: `test_${Date.now()}@test.com`,
      passwordHash: 'hashed_password',
      gender: 'M',
      age: 25,
      ...data,
    },
  });
  createdPlayerIds.push(player.id);
  return player;
}

export async function createTestMatch(player1Id: string, player2Id: string, data?: Partial<Prisma.MatchUncheckedCreateInput>) {
  const match = await prisma.match.create({
    data: {
      player1Id,
      player2Id,
      format: 'BEST_OF_3',
      sportType: 'TENNIS',
      ...data,
    },
    include: {
      player1: true,
      player2: true,
    },
  });
  createdMatchIds.push(match.id);
  return match;
}

export async function createAuthHeader(user: { id: string; role?: string }): Promise<Record<string, string>> {
  const token = await new SignJWT({ sub: user.id, role: user.role || 'ATHLETE' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

export async function cleanup() {
  // Delete matches first (foreign key constraint)
  if (createdMatchIds.length > 0) {
    try {
      await prisma.match.deleteMany({
        where: { id: { in: createdMatchIds } },
      });
    } catch (e) {
      // Ignore errors during cleanup
    }
    createdMatchIds = [];
  }
  if (createdPlayerIds.length > 0) {
    try {
      await prisma.player.deleteMany({
        where: { id: { in: createdPlayerIds } },
      });
    } catch (e) {
      // Ignore errors during cleanup
    }
    createdPlayerIds = [];
  }
}
