import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError, validatedRequest } from '@/lib/api.logic';
import {
  listAllPlansLogic,
  updateOrCreatePlanLogic,
  UpsertPlanSchema,
} from './plans.logic';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'finance:subscriptions:read', null, async () => {
    try {
      const data = await listAllPlansLogic();
      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      return reportApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'finance:subscriptions:manage', null, async () => {
    try {
      const body = await validatedRequest(request, UpsertPlanSchema);
      const result = await updateOrCreatePlanLogic(body);
      return NextResponse.json(result, { status: 201 });
    } catch (error) {
      return reportApiError(error);
    }
  });
}

export async function PUT(request: NextRequest) {
  return withAccessHandler(request, 'finance:subscriptions:manage', null, async () => {
    try {
      const body = await validatedRequest(request, UpsertPlanSchema);
      const result = await updateOrCreatePlanLogic(body);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      return reportApiError(error);
    }
  });
}
