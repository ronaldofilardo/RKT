import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { getActor, bumpSessionVersion } from '@/services/accessService';
import { can } from '@/core/access';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getAccessUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Token de acesso requerido' }, { status: 401 });
    }

    const isSelf = user.id === id;
    if (!isSelf) {
      const actor = await getActor(user.id);
      if (!actor || !can(actor, 'platform:users:manage').allow) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para revogar sessões deste usuário' }, { status: 403 });
      }
    }

    await bumpSessionVersion(id);
    const updated = await prisma.user.findUnique({
      where: { id },
      select: { id: true, sessionVersion: true },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    logger.error('[USER REVOKE SESSIONS POST]', error);
    return reportApiError(error);
  }
}

