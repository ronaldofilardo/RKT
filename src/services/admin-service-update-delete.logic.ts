import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type { Role } from '@/schemas/contracts';
import { readPrismaError } from './admin-service-prisma-error.logic';

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; cpf?: string; role?: Role; club?: string | null; isActive?: boolean }
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'USER_NOT_FOUND' };

  const updateData: Prisma.UserUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
  if (data.cpf !== undefined) updateData.cpf = data.cpf.replace(/\D/g, '');
  if (data.role !== undefined) updateData.role = data.role;
  if (data.club !== undefined) updateData.club = data.club;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  try {
    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, cpf: true, role: true, club: true, isActive: true },
    });
  } catch (err) {
    if (readPrismaError(err).code === 'P2002') {
      return { error: 'DUPLICATE_ENTRY' };
    }
    throw err;
  }
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'USER_NOT_FOUND' };

  await prisma.user.delete({ where: { id } });
  return { success: true };
}
