import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { removeSpectator } from '@/services/spectator-concession.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const { id, userId: targetUserId } = await params;
    const result = await removeSpectator({
      matchId: id,
      spectatorUserId: targetUserId,
      userId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para remover acompanhante' }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  });
}

