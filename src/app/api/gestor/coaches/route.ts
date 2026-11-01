import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { CoachCreateSchema } from '@/lib/validators/coach-create.schema';
import { getGestorCtIds, getGestorCtId, denyGestor } from '../_logic';
import { listCoaches, createCoach } from '../coaches-logic';

export async function GET(request: NextRequest) {
  const ctIds = await getGestorCtIds(request);
  if (ctIds.length === 0) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId: ctIds[0] }), async () => {
    try {
      const memberships = await listCoaches(ctIds);
      return NextResponse.json(
        { items: memberships },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (error) {
      logger.error('[GESTOR COACHES GET]', error);
      return reportApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => null);
      const parsed = CoachCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }, { status: 400 });
      }

      const result = await createCoach(ctId, user.id, parsed.data);
      if ('error' in result) {
        return NextResponse.json({
          error: result.error,
          message: result.message,
          canLinkExisting: (result as any).canLinkExisting,
          existingUserName: (result as any).existingUserName,
        }, { status: result.status });
      }

      if (result.isExistingUser) {
        return NextResponse.json({
          message: `Treinador vinculado com sucesso ao clube. Como ${result.name} já possui conta no RKT, o acesso permanece com sua senha atual.`,
          userId: result.userId,
          isExistingUser: true,
        }, { status: 201 });
      }

      return NextResponse.json({
        message: 'Treinador criado com sucesso.',
        userId: result.userId,
        tempPassword: result.tempPassword,
        linkExpiresAt: result.linkExpiresAt,
        isExistingUser: false,
      }, { status: 201 });
    } catch (error) {
      logger.error('[GESTOR COACHES POST]', error);
      return reportApiError(error);
    }
  });
}
