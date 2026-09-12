import { prisma } from '@/lib/prisma';
import type { Role } from '@/schemas/contracts';
import bcrypt from 'bcryptjs';

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

export async function createUser(data: {
  name: string;
  email: string;
  cpf?: string;
  password: string;
  role: Role;
  club?: string;
}) {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanCpf = (data.cpf || `temp_${Date.now()}`).replace(/\D/g, '') || `cpf_${Date.now()}`;

  const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existingEmail) return { error: 'EMAIL_ALREADY_EXISTS' };

  if (data.cpf) {
    const existingCpf = await prisma.user.findUnique({ where: { cpf: cleanCpf } });
    if (existingCpf) return { error: 'CPF_ALREADY_EXISTS' };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    return await prisma.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        cpf: cleanCpf,
        passwordHash,
        role: data.role,
        club: data.club || null,
      },
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
    });
  } catch (err: any) {
    if (err?.code === 'P2002') {
      const target = err?.meta?.target;
      if (Array.isArray(target) && target.includes('cpf')) {
        return { error: 'CPF_ALREADY_EXISTS' };
      }
      return { error: 'EMAIL_ALREADY_EXISTS' };
    }
    throw err;
  }
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; cpf?: string; role?: Role; club?: string | null; isActive?: boolean }
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return { error: 'USER_NOT_FOUND' };

  const updateData: Record<string, any> = {};
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
  } catch (err: any) {
    if (err?.code === 'P2002') {
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
