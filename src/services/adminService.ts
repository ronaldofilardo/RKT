import { prisma } from '@/lib/prisma';
import type { Role } from '@/schemas/contracts';
import { formatAdminUser, type FormattedAdminUser } from './admin-service-profile.logic';

export { createUser } from './admin-service-create.logic';
export { updateUser, deleteUser } from './admin-service-update-delete.logic';

export async function listAllUsers(options?: {
  cursor?: string;
  limit?: number;
  role?: Role;
}): Promise<FormattedAdminUser[]> {
  const { cursor, limit = 20, role } = options || {};

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      role: true,
      club: true,
      isActive: true,
      createdAt: true,
      canOperate: true,
      memberships: {
        where: { status: 'ACTIVE' },
        select: {
          kind: true,
          preset: true,
          status: true,
          ctId: true,
          ct: { select: { name: true } },
        },
      },
      athleteProfile: {
        select: {
          id: true,
          club: true,
          playerCts: {
            where: { status: 'ACTIVE' },
            select: {
              status: true,
              ct: { select: { name: true } },
            },
          },
        },
      },
    },
    where: {
      ...(role ? { role } : {}),
    },
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return users.map(formatAdminUser);
}
