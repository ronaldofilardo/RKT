import { prisma } from '@/lib/prisma';
import type { Role } from '@/schemas/contracts';
import bcrypt from 'bcryptjs';
import { readPrismaError } from './admin-service-prisma-error.logic';

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
  } catch (err) {
    const { code, target } = readPrismaError(err);
    if (code === 'P2002') {
      if (Array.isArray(target) && target.includes('cpf')) {
        return { error: 'CPF_ALREADY_EXISTS' };
      }
      return { error: 'EMAIL_ALREADY_EXISTS' };
    }
    throw err;
  }
}
