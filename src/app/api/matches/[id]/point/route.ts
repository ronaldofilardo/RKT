import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { emitMatchEvent } from '@/lib/match-events';
import { reportPointRouteFailure } from './route.logic';
import { parsePointRequestBody } from './route-parse.logic';
import { runPointTransaction } from './route-transaction.logic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async (user) => {
    let requestId = '';
    let requestClientEventId: string | undefined;
    try {
      const { id } = await params;
      requestId = id;

      const parsed = await parsePointRequestBody(request);
      if (!parsed.ok) return parsed.response;
      requestClientEventId = parsed.data.clientEventId;

      const result = await runPointTransaction({
        matchId: id,
        data: parsed.data,
        userId: user?.id,
        userRole: user?.role,
      });

      if (result?.scoreState) {
        emitMatchEvent(id, 'point_scored', result.scoreState);
      }

      return NextResponse.json({
        scoreState: result?.scoreState,
        version: result?.version,
        pointLogId: result?.pointLogId,
      });
    } catch (error) {
      return reportPointRouteFailure(error, requestId, requestClientEventId);
    }
  });
}
