import { NextRequest } from 'next/server';
import { withRLSHandler } from '@/lib/auth';
import { patchMatchState } from './state-route-patch.logic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', () => patchMatchState(request, { params }));
}

export const POST = PATCH;
