/**
 * Prisma adapter for `IPlayerRepository`.
 *
 * Wraps queries from `playerService.ts`. Mirrors the existing `select` shapes.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import { prisma } from '@/lib/prisma';
import { Prisma, type Player } from '@prisma/client';
import type { IPlayerRepository, PlayerUpsertInput, PlayerUpdateInput } from '../ports/player.repository.port';

const LIST_SELECT = {
  id: true,
  name: true,
  gender: true,
  age: true,
  birthDate: true,
  dominance: true,
  backhand: true,
  ranking: true,
  rankings: true,
} as const;

const DETAIL_SELECT = { ...LIST_SELECT, createdByUserId: true } as const;

export class PrismaPlayerRepository implements IPlayerRepository {
  async list(cursor?: string | null, limit = 20, userId?: string | null): Promise<Partial<Player>[]> {
    return prisma.player.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: userId ? { createdByUserId: userId } : {},
      select: LIST_SELECT,
      orderBy: { name: 'asc' },
    }) as unknown as Promise<Partial<Player>[]>;
  }

  async findByEmail(email: string): Promise<{ id: string; name: string; email: string; role: string; passwordHash: string } | null> {
    return prisma.player.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true, passwordHash: true },
    });
  }

  async findById(id: string): Promise<Partial<Player> | null> {
    return prisma.player.findUnique({ where: { id }, select: DETAIL_SELECT }) as unknown as Promise<Partial<Player> | null>;
  }

  async update(id: string, data: PlayerUpdateInput): Promise<Partial<Player>> {
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
      select: LIST_SELECT,
    }) as unknown as Promise<Partial<Player>>;
  }

  async create(data: PlayerUpsertInput): Promise<Partial<Player>> {
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
        ...(data.rankings !== undefined && { rankings: data.rankings as unknown as Prisma.InputJsonValue }),
        createdByUserId: data.createdByUserId,
      },
      select: LIST_SELECT,
    }) as unknown as Promise<Partial<Player>>;
  }
}
