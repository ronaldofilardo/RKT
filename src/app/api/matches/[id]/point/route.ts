import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { emitMatchEvent } from '@/lib/match-events';
import { reportPointRouteFailure } from './route.logic';
import { parsePointRequestBody } from './route-parse.logic';
import { runPointTransaction } from './route-transaction.logic';
import { flexibleIdValidator } from '@/schemas/common';

const ParamsSchema = z.object({ id: flexibleIdValidator });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    let requestId = '';
    let requestClientEventId: string | undefined;
    try {
      const parsedParams = ParamsSchema.safeParse(await params);
      if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
      const { id } = parsedParams.data;
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
