import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { resolveOrCreateAnnotation } from '@/services/match-resolve-annotation.logic';
import { resolveAnnotationCtId } from '@/services/match-ct-id.logic';

/** Cria a anotação soberana do usuário a partir de um cartaz do pool. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withAccessHandler(request, 'match:create', null, async ({ user, actor }) => {
    try {
      const { templateId } = await params;
      const rawBody = await request.json().catch(() => ({}));
      const mode = rawBody?.mode === 'create' ? 'create' : 'resolve';
      // `PARTICULAR` → null (corrige gravação indevida do CT do cartaz); sem contexto → inferência restrita a membros.
      const ctId = resolveAnnotationCtId(user);
      const result = await resolveOrCreateAnnotation(templateId, actor, mode, ctId);
      return NextResponse.json(
        { matchId: result.matchId, created: result.created, state: result.state },
        { status: result.created ? 201 : 200 },
      );
    } catch (error) {
      logger.error('[MATCH POOL ANNOTATE POST]', error);
      return reportApiError(error);
    }
  });
}
