import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { getActor } from '@/services/accessService';
import { can } from '@/core/access';

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

    const found = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        role: true,
        club: true,
        isActive: true,
        canOperate: true,
        createdAt: true,
        updatedAt: true,
        memberships: true,
      },
    });
    if (!found) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json(found, { status: 200 });
  } catch (error) {
    logger.error('[USER EXPORT GET]', error);
    return reportApiError(error);
  }
}

