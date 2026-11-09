import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { createAnnotationFromTemplate } from '@/services/match-template-create.logic';

/** Cria a anotação soberana do usuário a partir de um cartaz do pool. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withAccessHandler(request, 'match:create', null, async ({ user }) => {
    try {
      const { templateId } = await params;
      const ctId = user.contextId && user.contextId !== 'PARTICULAR' ? user.contextId : null;
      const match = await createAnnotationFromTemplate(templateId, user.id, ctId);
      return NextResponse.json({ matchId: match.id }, { status: 201 });
    } catch (error) {
      logger.error('[MATCH POOL ANNOTATE POST]', error);
      return reportApiError(error);
    }
  });
}
