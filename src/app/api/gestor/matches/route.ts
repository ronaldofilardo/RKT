import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../_logic';
import { loadGestorMatchesData } from './gestor-matches.logic';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const data = await loadGestorMatchesData(ctId);
      return NextResponse.json({
        items: data.items,
        externalItems: data.externalItems,
        total: data.items.length,
      }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR MATCHES GET]', error);
      return reportApiError(error);
    }
  });
}
