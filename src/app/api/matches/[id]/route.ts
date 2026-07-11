import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getMatch, updateMatch, deleteMatch } from '@/services/matchService';
import { DeleteMatchInputSchema } from '@/schemas/contracts';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'SPECTATOR');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const match = await getMatch(id);

    if (!match) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'GESTOR');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateMatch(id, body);

    if (!updated) {
      return NextResponse.json({ error: 'MATCH_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[MATCH PUT]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleCheck = await requireRole(request, 'GESTOR');
  if (roleCheck) return roleCheck;

  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'soft';
    const reason = searchParams.get('reason') || undefined;

    const parsed = DeleteMatchInputSchema.safeParse({ type, reason });
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '');
    let deletedBy: string | undefined;
    if (accessToken) {
      try {
        const { jwtVerify } = await import('jose');
        const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(accessToken, JWT_SECRET);
        deletedBy = payload.sub as string;
      } catch {
        // Ignore se token inválido
      }
    }

    const result = await deleteMatch(id, {
      type: parsed.data.type,
      reason: parsed.data.reason,
      deletedBy,
    });

    if ('error' in result) {
      const status = result.error === 'MATCH_NOT_FOUND' ? 404 : 422;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[MATCH DELETE]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
