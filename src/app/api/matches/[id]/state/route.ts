import { NextRequest, NextResponse } from 'next/server';
import { MatchStateInputSchema } from '@/schemas/contracts';
import { requireRole } from '@/lib/auth';
import { transitionMatchState } from '@/services/matchService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = MatchStateInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await transitionMatchState(
      id,
      parsed.data.state,
      parsed.data.initialServerId,
      parsed.data.scoreState,
    );

    if (!result) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MATCH STATE]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
