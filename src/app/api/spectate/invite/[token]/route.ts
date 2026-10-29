import { NextRequest, NextResponse } from 'next/server';
import { getInvitePreview } from '@/services/spectator-preview.service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await getInvitePreview(token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
