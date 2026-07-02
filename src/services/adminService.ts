import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function listAllUsers() {
  return prisma.player.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      club: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  club?: string;
}) {
  const existing = await prisma.player.findUnique({ where: { email: data.email } });
  if (existing) return { error: 'EMAIL_ALREADY_EXISTS' };

  const passwordHash = await bcrypt.hash(data.password, 10);

  return prisma.player.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role as any,
      club: data.club || null,
    },
    select: { id: true, name: true, email: true, role: true, club: true, createdAt: true },
  });
}

export async function updateUser(id: string, data: { name?: string; role?: string; club?: string | null }) {
  const user = await prisma.player.findUnique({ where: { id } });
  if (!user) return { error: 'USER_NOT_FOUND' };

  return prisma.player.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.role !== undefined ? { role: data.role as any } : {}),
      ...(data.club !== undefined ? { club: data.club } : {}),
    },
    select: { id: true, name: true, email: true, role: true, club: true },
  });
}

export async function deleteUser(id: string) {
  const user = await prisma.player.findUnique({ where: { id } });
  if (!user) return { error: 'USER_NOT_FOUND' };

  await prisma.player.delete({ where: { id } });
  return { success: true };
}
