import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { resolveOrCreateAnnotation } from '@/services/match-resolve-annotation.logic';
import { resolveAnnotationCtId } from '@/services/match-ct-id.logic';
import { flexibleIdValidator } from '@/schemas/common';

const ParamsSchema = z.object({ templateId: flexibleIdValidator });

/** Cria a anotação soberana do usuário a partir de um cartaz do pool. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withAccessHandler(request, 'match:create', null, async ({ user, actor }) => {
    try {
      const parsedParams = ParamsSchema.safeParse(await params);
      if (!parsedParams.success) {
        return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
      }
      const { templateId } = parsedParams.data;
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
