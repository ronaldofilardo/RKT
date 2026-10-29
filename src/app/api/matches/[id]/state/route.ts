import { NextRequest } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { patchMatchState } from './state-route-patch.logic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    return patchMatchState(request, { params, user });
  });
}

export const POST = PATCH;
