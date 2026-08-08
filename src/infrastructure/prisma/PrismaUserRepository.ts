/**
 * Prisma adapter for `IUserRepository` (admin-only `Player` access).
 *
 * Wraps queries from `adminService.ts`. Mirrors the existing `select` shapes.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import { prisma } from '@/lib/prisma';
import type { Role } from '@/schemas/contracts';
import type { IUserRepository, UserCreateInput, UserUpdateInput } from '../ports/user.repository.port';

export class PrismaUserRepository implements IUserRepository {
  async listAll(options?: { cursor?: string; limit?: number; role?: Role }): Promise<unknown[]> {
    const { cursor, limit = 20, role } = options ?? {};
    return prisma.player.findMany({
      select: { id: true, name: true, email: true, role: true, club: true, createdAt: true },
      where: { ...(role ? { role } : {}) },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    return prisma.player.findUnique({ where: { email }, select: { id: true } });
  }

  async create(data: UserCreateInput): Promise<unknown> {
    return prisma.player.create({
      data: { name: data.name, email: data.email, passwordHash: data.passwordHash, role: data.role as any, club: data.club || null },
      select: { id: true, name: true, email: true, role: true, club: true, createdAt: true },
    });
  }

  async findById(id: string): Promise<unknown | null> {
    return prisma.player.findUnique({ where: { id } });
  }

  async update(id: string, data: UserUpdateInput): Promise<unknown> {
    const { name, role, club } = data;
    return prisma.player.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role: role as any } : {}),
        ...(club !== undefined ? { club } : {}),
      },
      select: { id: true, name: true, email: true, role: true, club: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.player.delete({ where: { id } });
  }
}
