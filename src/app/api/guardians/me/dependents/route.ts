import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getGuardianDependents } from './dependents-read.logic';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ user, actor }) => {
    try {
      const dependents = await getGuardianDependents(user.id);
      return NextResponse.json({
        ok: true,
        dependents,
        canOperate: Boolean(actor.canOperate),
      });
    } catch (error) {
      logger.error('[GUARDIAN DEPENDENTS GET]', error);
      return reportApiError(error);
    }
  });
}
