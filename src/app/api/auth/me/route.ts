import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequestScoped } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { buildMeAccess } from './me-access.logic';

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
        mustChangePassword: true,
        canOperate: true,
        memberships: {
          where: { status: 'ACTIVE' },
          select: {
            kind: true,
            preset: true,
            ctId: true,
            status: true,
          },
        },
        athleteProfile: {
          select: {
            id: true,
            birthDate: true,
            playerCts: { where: { status: 'ACTIVE' }, select: { ctId: true } },
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
        { status: 404 },
      );
    }

    const memberships = (dbUser.memberships ?? []).map((m) => ({
      kind: m.kind,
      ctId: m.ctId ?? null,
      status: m.status,
    }));

    let ctStatus: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | null = null;
    const gestorMembership = memberships.find((m) => m.kind === 'GESTOR' && m.ctId);
    if (gestorMembership?.ctId) {
      const ct = await prisma.trainingCenter.findUnique({
        where: { id: gestorMembership.ctId },
        select: { status: true },
      });
      ctStatus = (ct?.status as 'PENDING' | 'ACTIVE' | 'SUSPENDED') ?? null;
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        cpf: dbUser.cpf,
        mustChangePassword: dbUser.mustChangePassword,
      },
      memberships,
      ctStatus,
      ...buildMeAccess(dbUser),
    });
  } catch (error) {
    logger.error('[AUTH ME GET]', error);
    return reportApiError(error);
  }
}
