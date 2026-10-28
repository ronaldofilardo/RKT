import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ensureAthletePlayer } from './signup-athlete.logic';

export type SignupInput = {
  name: string;
  identifier: string;
  password: string;
  role: string;
  cpf?: string | null;
  birthDate?: string | null;
};

export async function handleSignupPost(input: SignupInput): Promise<NextResponse> {
  const { name, identifier, password, role, cpf: cpfRaw, birthDate: birthDateRaw } = input;
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');
  const email = isEmail ? trimmed.toLowerCase() : null;

  // User.cpf só deve conter CPF real (ou null). Nunca grava e-mail nessa coluna (P6).
  const cpfValue = cpfRaw ?? null;

  const existing = await prisma.user.findFirst({
    where: isEmail ? { email: email ?? undefined } : { cpf: cpfValue ?? undefined },
  });
  if (existing) {
    return NextResponse.json({ error: 'CONFLICT', message: 'Conta já existe' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email: email ?? `${cpfValue}@local`,
      cpf: cpfValue,
      passwordHash,
      canOperate: true,
      role: 'ANNOTATOR',
    },
  });

  if (role === 'TREINADOR') {
    await prisma.membership.create({
      data: { userId: user.id, kind: 'TREINADOR', status: 'ACTIVE' },
    });
    return NextResponse.json({ id: user.id, name: user.name, role }, { status: 201 });
  }

  if (role === 'ATLETA' || role === 'ATLETA_AVULSO' || role === 'ATLETA_CLUBE') {
    const result = await ensureAthletePlayer({
      userId: user.id,
      name,
      email: email ?? null,
      role: role as 'ATLETA' | 'ATLETA_AVULSO' | 'ATLETA_CLUBE',
      cpfRaw,
      birthDateRaw,
    });
    return NextResponse.json(
      { id: user.id, name: user.name, role, ...result },
      { status: 201 },
    );
  }

  return NextResponse.json({ id: user.id, name: user.name, role }, { status: 201 });
}

export async function signupPost(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => null)) as SignupInput;
    return handleSignupPost(body);
  } catch (error) {
    logger.error('[SIGNUP POST]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
