import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getUserFromRequestScoped } from '@/lib/auth';
import { bumpSessionVersion } from '@/services/accessService';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequestScoped(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true, mustChangePassword: true, tempPasswordExpiresAt: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Usuário não encontrado' }, { status: 404 });
    }

    const validPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: 'INVALID_PASSWORD', message: 'Senha atual inválida' }, { status: 401 });
    }

    // Verifica se a senha provisória expirou
    if (dbUser.mustChangePassword && dbUser.tempPasswordExpiresAt) {
      const now = new Date();
      if (now > dbUser.tempPasswordExpiresAt) {
        return NextResponse.json(
          { error: 'EXPIRED', message: 'Senha provisória expirada. Solicite um novo link de acesso.' },
          { status: 403 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          mustChangePassword: false,
          tempPasswordExpiresAt: null,
        },
      }),
    ]);

    await bumpSessionVersion(user.id);

    return NextResponse.json(
      { message: 'Senha alterada com sucesso.' },
      { status: 200 },
    );
  } catch (error) {
    logger.error('[CHANGE-PASSWORD POST]', error);
    return reportApiError(error);
  }
}
