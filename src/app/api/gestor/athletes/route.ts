import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { AthleteCreateSchema } from '@/lib/validators/athlete-create.schema';
import { getGestorCtId, denyGestor } from '../_logic';
import { createAthleteByGestor } from '../athletes-logic';
import { getGestorAthletesList } from './athletes-get.logic';

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const items = await getGestorAthletesList(ctId);
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR ATHLETES GET]', error);
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
      const parsed = AthleteCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }, { status: 400 });
      }

      const result = await createAthleteByGestor({
        ...parsed.data,
        ctId,
        issuedByUserId: user.id,
      });

      if (result.conflict) {
        return NextResponse.json({
          error: 'CONFLICT', message: result.message, inviteKind: result.inviteKind,
          canLinkExisting: 'canLinkExisting' in result ? result.canLinkExisting : undefined,
          existingUserName: 'existingUserName' in result ? result.existingUserName : undefined,
        }, { status: 409 });
      }

      if ('isExistingUser' in result && result.isExistingUser) {
        return NextResponse.json({
          message: 'Atleta vinculado com sucesso ao clube. Como já possui conta no RKT, o acesso permanece com a senha atual.',
          userId: result.userId, playerId: result.playerId, isExistingUser: true,
        }, { status: 201 });
      }

      return NextResponse.json({
        message: 'Atleta criado com sucesso.',
        userId: result.userId,
        playerId: result.playerId,
        tempPassword: result.tempPassword,
        linkExpiresAt: result.linkExpiresAt,
        isExistingUser: false,
        isMinor: result.isMinor,
        guardianNoticeToken: result.guardianNoticeToken,
        guardianName: result.guardianName,
      }, { status: 201 });
    } catch (error) {
      logger.error('[GESTOR ATHLETES POST]', error);
      return reportApiError(error);
    }
  });
}
