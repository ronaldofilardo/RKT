import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { getFinancialOverviewLogic } from './overview.logic';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'finance:subscriptions:read', null, async () => {
    try {
      const data = await getFinancialOverviewLogic();
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      return reportApiError(error);
    }
  });
}
