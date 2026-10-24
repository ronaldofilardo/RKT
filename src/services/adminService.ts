import { prisma } from '@/lib/prisma';
import type { Role } from '@/schemas/contracts';

export { createUser } from './admin-service-create.logic';
export { updateUser, deleteUser } from './admin-service-update-delete.logic';

export async function listAllUsers(options?: {
  cursor?: string;
  limit?: number;
  role?: Role;
}) {
  const { cursor, limit = 20, role } = options || {};

  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      role: true,
      club: true,
      isActive: true,
      createdAt: true,
    },
    where: {
      ...(role ? { role } : {}),
    },
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}
