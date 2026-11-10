import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError, validatedRequest } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { assignCoachToTemplate } from '@/services/match-assign.logic';

const AssignBodySchema = z.object({
  coachUserId: z.string().min(1, 'coachUserId é obrigatório'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  return withAccessHandler(request, null, null, async ({ user, actor }) => {
    try {
      const { templateId } = await params;
      const body = await validatedRequest(request, AssignBodySchema);
      const actorName = (user as any).name || 'Gestor';

      const result = await assignCoachToTemplate(actor, actorName, templateId, body.coachUserId);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      logger.error('[MATCH POOL ASSIGN POST]', error);
      return reportApiError(error);
    }
  });
}

