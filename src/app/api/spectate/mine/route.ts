import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { listMySpectatingMatches } from '@/services/spectator-list.service';

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const matches = await listMySpectatingMatches(user.id);
    return NextResponse.json({ matches });
  });
}

