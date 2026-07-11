import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { finishMatch } from '@/services/matchService';
import { FinishMatchInputSchema } from '@/schemas/contracts';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'ATHLETE');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = FinishMatchInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await finishMatch(
      id,
      parsed.data.scoreState,
      {
        reason: parsed.data.reason,
        note: parsed.data.note,
      }
    );

    if (!result) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MATCH FINISH]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}