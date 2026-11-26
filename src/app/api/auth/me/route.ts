import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequestScoped } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { buildMeAccess } from './me-access.logic';
import { resolveAvailableContexts } from '../login/login-contexts.logic';
import { listAreas } from '@/core/access/areas';
import { ME_USER_SELECT } from './me-select.logic';
import { filterFollowedPlayers } from '@/services/access-actor.logic';
import { resolveUserBillingState } from './me-billing.logic';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequestScoped(request);
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Token de acesso requerido' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: ME_USER_SELECT });

    if (!dbUser) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Usuário não encontrado' }, { status: 404 });
    }

    const memberships = (dbUser.memberships ?? []).map((m) => ({
      kind: m.kind,
      ctId: m.ctId ?? null,
      status: m.status,
    }));

    const followedPlayerIds = filterFollowedPlayers(dbUser as any, user.contextId, user.activeArea);
    const guardianOfPlayerIds = ((dbUser as any).guardianLinks ?? []).map((l: any) => l.playerId);

    let ctStatus: 'ACTIVE' | 'SUSPENDED' | null = null;
    const gestorMembership = memberships.find((m) => m.kind === 'GESTOR' && m.ctId);
    if (gestorMembership?.ctId) {
      const ct = await prisma.trainingCenter.findUnique({
        where: { id: gestorMembership.ctId },
        select: { status: true },
      });
      ctStatus = (ct?.status as 'ACTIVE' | 'SUSPENDED') ?? null;
    }

    const availableContexts = await resolveAvailableContexts(dbUser.id);
    const availableAreas = listAreas({
      role: dbUser.role,
      canOperate: dbUser.canOperate,
      memberships: dbUser.memberships,
      athlete: dbUser.athleteProfile ? { playerId: dbUser.athleteProfile.id } : null,
      isGuardian: guardianOfPlayerIds.length > 0,
    });

    const billing = await resolveUserBillingState({
      userId: dbUser.id,
      role: dbUser.role,
      createdAt: dbUser.createdAt,
      activeContextId: user.contextId ?? null,
      activeArea: user.activeArea ?? null,
      memberships,
    });

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
      activeContextId: user.contextId ?? null,
      activeArea: user.activeArea ?? null,
      followedPlayerIds,
      guardianOfPlayerIds,
      isGuardian: guardianOfPlayerIds.length > 0,
      availableContexts,
      availableAreas,
      billing,
      ...buildMeAccess(dbUser, new Date(), user.contextId),
    });
  } catch (error) {
    logger.error('[AUTH ME GET]', error);
    return reportApiError(error);
  }
}
