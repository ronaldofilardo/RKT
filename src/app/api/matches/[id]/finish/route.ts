import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler, getRLSUser } from '@/lib/auth';
import { finishMatch } from '@/services/matchService';
import { FinishMatchInputSchema } from '@/schemas/contracts';
import { emitMatchEvent } from '@/lib/match-events';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = FinishMatchInputSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const user = getRLSUser();

      // Bug (2026-09-06): winnerId e isManualScoreEdit eram validados pelo
      // schema (agora) mas nunca chegavam a matchService.finishMatch — toda
      // partida encerrada via "Editar Placar" ficava com state: FINISHED
      // porém sem winnerId gravado, e sem o segmento de auditoria em
      // MatchScoreEdit que /report usa para reconstruir a timeline.
      const result = await finishMatch(
        id,
        parsed.data.scoreState,
        {
          reason: parsed.data.reason,
          note: parsed.data.note,
          expectedVersion: parsed.data.version,
          winnerId: parsed.data.winnerId,
          isManualScoreEdit: parsed.data.isManualScoreEdit,
          editedByUserId: user?.id,
        }
      );

      if (!result) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      if ('error' in result) {
        const status = result.error === 'VERSION_CONFLICT' ? 409 : 422;
        return NextResponse.json({ error: result.error }, { status });
      }

      emitMatchEvent(id, 'state_changed', { action: 'match_finished', scoreState: parsed.data.scoreState });

      return NextResponse.json(result);
    } catch (error) {
      logger.error('[MATCH FINISH]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}