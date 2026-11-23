import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { revokeShareLink } from '@/services/spectator-share.service';
import { flexibleIdValidator } from '@/schemas/common';

const ParamsSchema = z.object({
  id: flexibleIdValidator,
  linkId: flexibleIdValidator,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const parsedParams = ParamsSchema.safeParse(await params);
    if (!parsedParams.success) return NextResponse.json({ error: 'INVALID_PARAMS' }, { status: 400 });
    const { id, linkId } = parsedParams.data;
    const result = await revokeShareLink({ matchId: id, linkId, userId: user.id });
    if (!result.ok) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Sem permissão para revogar o convite' }, { status: 403 });
    }
    return NextResponse.json({ success: true });
  });
}

