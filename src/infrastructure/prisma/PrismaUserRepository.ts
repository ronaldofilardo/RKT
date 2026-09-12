/**
 * Prisma adapter for `IUserRepository` (`users` table access).
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import { prisma } from '@/lib/prisma';
import type { Role } from '@/schemas/contracts';
import type { IUserRepository, UserCreateInput, UserUpdateInput } from '../ports/user.repository.port';

export class PrismaUserRepository implements IUserRepository {
  async listAll(options?: { cursor?: string; limit?: number; role?: Role }): Promise<unknown[]> {
    const { cursor, limit = 20, role } = options ?? {};
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, cpf: true, role: true, club: true, isActive: true, createdAt: true },
      where: { ...(role ? { role } : {}) },
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string): Promise<{ id: string } | null> {
    return prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } });
  }

  async findByCpf(cpf: string): Promise<{ id: string } | null> {
    const cleanCpf = cpf.replace(/\D/g, '');
    return prisma.user.findUnique({ where: { cpf: cleanCpf }, select: { id: true } });
  }

  async findByIdentifier(identifier: string): Promise<{
    id: string;
    name: string;
    email: string;
    cpf: string;
    role: Role;
    passwordHash: string;
    isActive: boolean;
  } | null> {
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return prisma.user.findUnique({
        where: { email: trimmed.toLowerCase() },
        select: {
          id: true,
          name: true,
          email: true,
          cpf: true,
          role: true,
          passwordHash: true,
          isActive: true,
        },
      });
    }

    const cleanCpf = trimmed.replace(/\D/g, '');
    return prisma.user.findUnique({
      where: { cpf: cleanCpf },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        passwordHash: true,
        isActive: true,
      },
    });
  }

  async create(data: UserCreateInput): Promise<unknown> {
    const cleanCpf = data.cpf.replace(/\D/g, '');
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.trim().toLowerCase(),
        cpf: cleanCpf,
        passwordHash: data.passwordHash,
        role: data.role,
        club: data.club || null,
      },
      select: { id: true, name: true, email: true, cpf: true, role: true, club: true, isActive: true, createdAt: true },
    });
  }

  async findById(id: string): Promise<unknown | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, data: UserUpdateInput): Promise<unknown> {
    const { name, email, cpf, role, club, isActive } = data;
    return prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email: email.trim().toLowerCase() } : {}),
        ...(cpf !== undefined ? { cpf: cpf.replace(/\D/g, '') } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(club !== undefined ? { club } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: { id: true, name: true, email: true, cpf: true, role: true, club: true, isActive: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
