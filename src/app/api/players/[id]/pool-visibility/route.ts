import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { setPlayerPoolVisibility } from '@/services/player-pool-visibility.logic';

const BodySchema = z.object({ visible: z.boolean() });

/** Opt-in/opt-out de visibilidade do atleta no pool público. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAccessHandler(request, null, null, async ({ user, actor }) => {
    try {
      const { id } = await params;
      const parsed = BodySchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Campo "visible" é obrigatório' },
          { status: 400 },
        );
      }

      const isPlatformStaff = actor.memberships.some(
        (m) => m.kind === 'PLATAFORMA' && m.status === 'ACTIVE',
      );

      const result = await setPlayerPoolVisibility({
        playerId: id,
        actorUserId: user.id,
        isPlatformStaff,
        visible: parsed.data.visible,
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: result.status },
        );
      }

      return NextResponse.json({ data: result }, { status: 200 });
    } catch (error) {
      logger.error('[PLAYER POOL VISIBILITY PATCH]', error);
      return reportApiError(error);
    }
  });
}
