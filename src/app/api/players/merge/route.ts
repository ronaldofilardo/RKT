import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { mergePlayers } from '@/services/player-merge.logic';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const BodySchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'platform:player:merge', null, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }
      const { sourceId, targetId } = parsed.data;

      const result = await mergePlayers({ sourceId, targetId, actorUserId: user.id });
      return NextResponse.json({ message: 'Mesclagem realizada com sucesso.', data: result }, { status: 200 });
    } catch (error) {
      logger.error('[PLAYER MERGE POST]', error);
      return reportApiError(error);
    }
  });
}
