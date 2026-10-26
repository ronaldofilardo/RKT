import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const SignupSchema = z.object({
  name: z.string().min(2).max(120),
  identifier: z.string().min(3).max(120),
  password: z.string().min(8).max(128),
  role: z.enum(['ATLETA', 'TREINADOR', 'ESPECTADOR']),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const { name, identifier, password, role } = parsed.data;
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const email = isEmail ? trimmed.toLowerCase() : null;
    const cpf = isEmail ? null : trimmed.replace(/\D/g, '');

    const existing = await prisma.user.findFirst({
      where: isEmail ? { email: email ?? undefined } : { cpf: cpf ?? undefined },
    });
    if (existing) {
      return NextResponse.json({ error: 'CONFLICT', message: 'Conta já existe' }, { status: 409 });
    }

    const cpfValue = cpf && cpf.length > 0 ? cpf : trimmed;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: email ?? `${cpf}@local`,
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
    }

    return NextResponse.json({ id: user.id, name: user.name, role }, { status: 201 });
  } catch (error) {
    logger.error('[SIGNUP POST]', error);
    return reportApiError(error);
  }
}
