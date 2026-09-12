import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function authenticateUser(identifier: string, password: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const isEmail = trimmed.includes('@');
  const user = await prisma.user.findUnique({
    where: isEmail
      ? { email: trimmed.toLowerCase() }
      : { cpf: trimmed.replace(/\D/g, '') },
  });

  if (!user || !user.isActive) return null;

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  return validPassword ? user : null;
}
