import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { bumpSessionVersion } from '@/services/accessService';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = parsed.error.errors[0]?.message || 'Dados inválidos';
      const fieldMap: Record<string, string> = {};
      for (const err of parsed.error.errors) {
        const p = err.path.join('.');
        if (p && !fieldMap[p]) fieldMap[p] = err.message;
      }
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: firstErr, fields: fieldMap, details: parsed.error.flatten() },
        { status: 400 },
      );
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
    if (dbUser.mustChangePassword && dbUser.tempPasswordExpiresAt && new Date() > dbUser.tempPasswordExpiresAt) {
      const res = NextResponse.json({ error: 'EXPIRED', message: 'Senha provisória expirada. Solicite um novo link de acesso.' }, { status: 403 });
      const cOpts = { path: '/', maxAge: 0, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };
      res.cookies.set('rkt_access_token', '', { ...cOpts, httpOnly: true });
      res.cookies.set('access_token', '', cOpts);
      res.cookies.set('user_role', '', cOpts);
      return res;
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

    const response = NextResponse.json({ message: 'Senha alterada com sucesso.' }, { status: 200 });
    const cookieOpts = { path: '/', maxAge: 0, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };
    response.cookies.set('rkt_access_token', '', { ...cookieOpts, httpOnly: true });
    response.cookies.set('access_token', '', cookieOpts);
    response.cookies.set('user_role', '', cookieOpts);
    return response;
  } catch (error) {
    logger.error('[CHANGE-PASSWORD POST]', error);
    return reportApiError(error);
  }
}
