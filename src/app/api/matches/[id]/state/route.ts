import { NextRequest, NextResponse } from 'next/server';
import { MatchStateInputSchema } from '@/schemas/contracts';
import { requireRole } from '@/lib/auth';
import { transitionMatchState } from '@/services/matchService';
import { prisma } from '@/lib/prisma';

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

    // CORREÇÃO #1: Optimistic Locking - verificar versão antes de atualizar
    const expectedVersion = parsed.data.version;
    if (expectedVersion !== undefined && parsed.data.scoreState) {
      const match = await prisma.match.findUnique({
        where: { id },
        select: { version: true },
      });

      if (match && match.version !== expectedVersion) {
        return NextResponse.json({
          error: 'VERSION_CONFLICT',
          message: 'Estado desatualizado. Outra atualização ocorreu simultaneamente.',
          currentVersion: match.version,
          expectedVersion,
        }, { status: 409 });
      }
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

    return NextResponse.json({
      ...result,
      version: result.version, // Retornar versão atualizada
    });
  } catch (error) {
    console.error('[MATCH STATE]', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
