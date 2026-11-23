import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { removeSpectator } from '@/services/spectator-concession.service';
import { flexibleIdValidator } from '@/schemas/common';

const ParamsSchema = z.object({
  id: flexibleIdValidator,
  userId: flexibleIdValidator,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
    const { id, userId: targetUserId } = parsedParams.data;
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

