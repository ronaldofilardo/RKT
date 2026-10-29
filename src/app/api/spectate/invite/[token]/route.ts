import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { getInvitePreview } from '@/services/spectator-preview.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  return withAccessHandler(request, null, null, async () => {
    const { token } = await params;
    const result = await getInvitePreview(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  });
}

