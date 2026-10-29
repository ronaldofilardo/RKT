import { NextRequest, NextResponse } from 'next/server';
import { CreateMatchInputSchema } from '@/schemas/contracts';
import { createMatch } from '@/services/matchService';
import { validatedRequest } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { assertCtMembership } from './match-ct-access.logic';
import { createMatchWithDuplicateCheck } from './match-create-with-duplicate-check.logic';

type RLSUser = { id: string; role: string } | null | undefined;

export async function postMatchResponse(
  request: NextRequest,
  user: RLSUser,
): Promise<NextResponse> {
  try {
    const { force, ...input } = await validatedRequest(request, CreateMatchInputSchema);

    const currentUserId = user?.id;
    await assertCtMembership(input.ctId, currentUserId);
    logger.match.created(currentUserId ?? "anonymous");

    if (!force) {
      const match = await createMatchWithDuplicateCheck(input, currentUserId);
      return NextResponse.json({ data: match, ...match }, { status: 201 });
    }

    const match = await createMatch(input, currentUserId);
    return NextResponse.json({ data: match, ...match }, { status: 201 });
  } catch (error) {
    logger.error('[MATCHES POST]', error);

    const err = error as { code?: string; name?: string; message?: string; details?: unknown; status?: number };
    if (err.code === 'CONFLICT' || err.name === 'ConflictError') {
      return NextResponse.json(
        { error: 'CONFLICT', message: err.message ?? 'Conflito', details: err.details },
        { status: 409 }
      );
    }

    if (err.name === 'ApiError' || err.code) {
      return NextResponse.json(
        { error: err.code ?? 'API_ERROR', message: err.message ?? 'Erro na API', details: err.details },
        { status: err.status ?? 500 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Erro ao criar partida' },
      { status: 500 }
    );
  }
}
