import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { resolveOrCreateAnnotation } from '@/services/match-resolve-annotation.logic';
import { resolveAnnotationCtId } from '@/services/match-ct-id.logic';

const AnnotateBodySchema = z.object({
  mode: z.enum(['resolve', 'create']).optional().default('resolve'),
});

/**
 * Resolve ou cria a anotação soberana do usuário para qualquer cartaz
 * (público ou privado do círculo autorizado).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAccessHandler(request, 'match:create', null, async ({ user, actor }) => {
    try {
      const { id } = await params;
      const rawBody = await request.json().catch(() => ({}));
      const parsed = AnnotateBodySchema.safeParse(rawBody);
      const mode = parsed.success ? parsed.data.mode : 'resolve';
      // `PARTICULAR` → null (corrige gravação indevida do CT do cartaz); sem contexto → inferência restrita a membros.
      const ctId = resolveAnnotationCtId(user);

      const result = await resolveOrCreateAnnotation(id, actor, mode, ctId);
      return NextResponse.json(
        { matchId: result.matchId, created: result.created, state: result.state },
        { status: result.created ? 201 : 200 },
      );
    } catch (error) {
      logger.error('[MATCH ANNOTATE POST]', error);
      return reportApiError(error);
    }
  });
}

