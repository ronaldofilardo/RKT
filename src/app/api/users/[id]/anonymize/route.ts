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
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para anonimizar este usuário' }, { status: 403 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: 'Usuário Removido',
        email: `anonymized_${id}@rkt.internal`,
        cpf: `anon_${id}`,
        isActive: false,
        canOperate: false,
      },
    });

    await bumpSessionVersion(id);

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'USER_ANONYMIZED',
        resourceType: 'User',
        resourceId: id,
      },
    });

    return NextResponse.json({ id: updated.id, message: 'Conta anonimizada com sucesso.' }, { status: 200 });
  } catch (error) {
    logger.error('[USER ANONYMIZE POST]', error);
    return reportApiError(error);
  }
}

