import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withRLSHandler } from '@/lib/auth';
import { updateMatch } from '@/services/matchService';

export async function handlePutMatch(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'GESTOR', async () => {
    try {
      const { id } = await params;
      const body = await request.json();
      const updated = await updateMatch(id, body);

      if (!updated) {
        return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
      }

      return NextResponse.json(updated);
    } catch (error) {
      logger.error('[MATCH PUT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
