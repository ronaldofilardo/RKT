import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../_logic';
import { fetchAffiliateAthletes } from './gestor-affiliates.logic';

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const q = request.nextUrl.searchParams.get('q') || undefined;
      const items = await fetchAffiliateAthletes(q);
      return NextResponse.json({ items }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR AFFILIATES GET]', error);
      return reportApiError(error);
    }
  });
}
