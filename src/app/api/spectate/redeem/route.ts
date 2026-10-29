import { NextRequest, NextResponse } from 'next/server';
import { withAccessHandler } from '@/lib/access-handler';
import { redeemShareLink } from '@/services/spectator-concession.service';
import { RedeemInviteInputSchema } from '@/schemas/spectate';

export async function POST(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ user }) => {
    const body = await request.json().catch(() => ({}));
    const parsed = RedeemInviteInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Token de convite inválido' }, { status: 400 });
    }

    const result = await redeemShareLink({
      token: parsed.data.token,
      userId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, matchId: result.matchId });
  });
}

