import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { getGuardianMatches } from './matches-read.logic';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    try {
      const matches = await getGuardianMatches(user.id);
      return NextResponse.json({ ok: true, matches });
    } catch (error) {
      logger.error('[GUARDIAN MATCHES GET]', error);
      return reportApiError(error);
    }
  });
}
