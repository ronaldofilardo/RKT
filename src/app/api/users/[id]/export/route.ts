import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { getActor } from '@/services/accessService';
import { can } from '@/core/access';
import { exportUserData } from '@/core/access/user-export.logic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para exportar dados de outro usuário' }, { status: 403 });
      }
    }

    const data = await exportUserData(id);

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'USER_DATA_EXPORTED',
        resourceType: 'User',
        resourceId: id,
      },
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logger.error('[USER EXPORT GET]', error);
    return reportApiError(error);
  }
}

