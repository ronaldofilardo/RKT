import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequestScoped } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequestScoped(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpf: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    logger.error('[AUTH ME GET]', error);
    return reportApiError(error);
  }
}
