import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { getActor } from '@/services/accessService';

const BodySchema = z.object({ playerId: z.string().min(1) });

async function checkAccess(userId: string, ctId: string): Promise<boolean> {
  const actor = await getActor(userId);
  if (!actor || !actor.isActive) return false;

  const isPlatformStaff = actor.memberships.some(
    (m) => m.kind === 'PLATAFORMA' && m.status === 'ACTIVE' && (m.preset === 'ADMIN' || m.preset === 'SUPORTE'),
  );
  if (isPlatformStaff) return true;

  const isGestor = actor.memberships.some(
    (m) => m.kind === 'GESTOR' && m.ctId === ctId && m.status === 'ACTIVE',
  );
  return isGestor;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getAccessUserFromRequest(_request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    if (!(await checkAccess(user.id, id))) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Ação não permitida' },
        { status: 403 },
      );
    }

    const items = await prisma.playerCT.findMany({ where: { ctId: id } });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[CT ATHLETES GET]', error);
    return reportApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 },
      );
    }

    if (!(await checkAccess(user.id, id))) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Ação não permitida' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const item = await prisma.playerCT.create({
      data: { ctId: id, playerId: parsed.data.playerId, status: 'ACTIVE' },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error('[CT ATHLETE POST]', error);
    return reportApiError(error);
  }
}
