import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { revokeShareLink } from '@/services/spectator-share.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const { id, linkId } = await params;
    const result = await revokeShareLink({ matchId: id, linkId, userId: user.id });
    if (!result.ok) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para revogar o convite' }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  });
}

