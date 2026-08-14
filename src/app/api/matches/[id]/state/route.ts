import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { MatchStateInputSchema } from '@/schemas/contracts';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { transitionMatchState } from '@/services/matchService';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ATHLETE', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = MatchStateInputSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const user = getRLSUser();

      const result = await transitionMatchState(
        id,
        parsed.data.state,
        parsed.data.initialServerId,
        parsed.data.scoreState,
        {
          allowScoreEdit: parsed.data.allowScoreEdit,
          expectedVersion: parsed.data.version,
          isManualScoreEdit: parsed.data.isManualScoreEdit,
          editedByUserId: user?.id,
        },
      );

      if (!result) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if ('error' in result) {
        const status = result.error === 'VERSION_CONFLICT' ? 409 : 422;
        if (result.error === 'VERSION_CONFLICT') {
          const current = await prisma.match.findUnique({
            where: { id },
            select: { version: true },
          });
          return NextResponse.json({
            error: 'VERSION_CONFLICT',
            message: 'Estado desatualizado. Outra atualização ocorreu simultaneamente.',
            currentVersion: current?.version,
            expectedVersion: parsed.data.version,
          }, { status: 409 });
        }
        return NextResponse.json({ error: result.error }, { status: status });
      }

      return NextResponse.json({
        ...result,
        version: result.version,
      });
    } catch (error) {
      logger.error('[MATCH STATE]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
