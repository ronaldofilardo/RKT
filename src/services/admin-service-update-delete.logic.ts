import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { readPrismaError } from './admin-service-prisma-error.logic';
import { syncUserRoleMemberships } from './admin-service-role-sync.logic';

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; cpf?: string; role?: string; club?: string | null; isActive?: boolean }
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'USER_NOT_FOUND' };

  const updateData: Prisma.UserUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
  if (data.cpf !== undefined) updateData.cpf = data.cpf.replace(/\D/g, '');
  if (data.role !== undefined) {
    updateData.role = data.role === 'ADMIN' ? 'ADMIN' : 'ANNOTATOR';
  }
  if (data.club !== undefined) updateData.club = data.club;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, cpf: true, role: true, club: true, isActive: true },
    });
    if (data.role !== undefined) {
      await syncUserRoleMemberships(id, data.role);
    }
    return updated;
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
