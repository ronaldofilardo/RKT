import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

export type AuthResult =
  | { success: true; user: User }
  | {
      success: false;
      reason: 'USER_NOT_FOUND' | 'INVALID_PASSWORD' | 'USER_INACTIVE';
      message: string;
    };

export async function authenticateUserDetailed(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return {
      success: false,
      reason: 'USER_NOT_FOUND',
      message: 'Informe seu e-mail ou CPF',
    };
  }

  const isEmail = trimmed.includes('@');
  const cleanedCpf = trimmed.replace(/\D/g, '');
  let user = await prisma.user.findUnique({
    where: isEmail ? { email: trimmed.toLowerCase() } : { cpf: cleanedCpf },
  });
  if (!user && !isEmail && cleanedCpf !== trimmed) {
    user = await prisma.user.findUnique({ where: { cpf: trimmed } });
  }

  if (!user) {
    return {
      success: false,
      reason: 'USER_NOT_FOUND',
      message: isEmail
        ? 'E-mail não encontrado. Verifique o endereço digitado ou crie uma conta.'
        : 'CPF não encontrado. Verifique os números digitados ou crie uma conta.',
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      reason: 'USER_INACTIVE',
      message: 'Esta conta está inativa ou suspensa. Entre em contato com o suporte.',
    };
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return {
      success: false,
      reason: 'INVALID_PASSWORD',
      message: 'Senha incorreta. Verifique a senha digitada ou redefina seu acesso.',
    };
  }

  return { success: true, user };
}

export async function authenticateUser(
  identifier: string,
  password: string,
): Promise<User | null> {
  const result = await authenticateUserDetailed(identifier, password);
  return result.success ? result.user : null;
}
