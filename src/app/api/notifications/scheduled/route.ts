import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { loadScheduledMatchesFeed } from './scheduled-matches-feed.logic';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      const notifications = await loadScheduledMatchesFeed(actor);
      return NextResponse.json(notifications);
    } catch (error) {
      logger.error('[NOTIFICATIONS SCHEDULED GET]', error);
      return reportApiError(error);
    }
  });
}
