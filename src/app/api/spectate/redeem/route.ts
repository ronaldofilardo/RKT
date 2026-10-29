import { NextRequest, NextResponse } from 'next/server';
import { getAccessUserFromRequest } from '@/lib/auth-credentials.logic';
import { redeemShareLink } from '@/services/spectator-concession.service';
import { RedeemInviteInputSchema } from '@/schemas/spectate';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = RedeemInviteInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Token de convite inválido' }, { status: 400 });
  }

  const user = await getAccessUserFromRequest(request);
  const result = await redeemShareLink({
    token: parsed.data.token,
    userId: user?.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ success: true, matchId: result.matchId });
  response.cookies.set(`rkt_spectator_${result.matchId}`, parsed.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600,
  });
  return response;
}
