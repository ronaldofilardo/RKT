import { NextRequest, NextResponse } from 'next/server';
import { CreateMatchInputSchema } from '@/schemas/contracts';
import { createMatch } from '@/services/matchService';
import { validatedRequest } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { assertCtMembership } from './match-ct-access.logic';
import { createMatchWithDuplicateCheck } from './match-create-with-duplicate-check.logic';
import {
  createAnnotationFromTemplate,
  createPublicTemplate,
} from '@/services/match-template-create.logic';
import type { RLSUser } from '@/lib/rls-context';

export async function postMatchResponse(
  request: NextRequest,
  user: RLSUser | null | undefined,
): Promise<NextResponse> {
  try {
    const { force, ...input } = await validatedRequest(request, CreateMatchInputSchema);

    const currentUserId = user?.id;
    if (user?.contextId) {
      input.ctId = user.contextId === 'PARTICULAR' ? undefined : user.contextId;
    }
    await assertCtMembership(input.ctId, currentUserId);
    logger.match.created(currentUserId ?? "anonymous");

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Token de acesso requerido' },
        { status: 401 }
      );
    }

    if (input.isPublicTemplate) {
      const template = await createPublicTemplate(input, currentUserId);
      return NextResponse.json({ data: template, ...template }, { status: 201 });
    }

    if (input.sourceMatchId) {
      const derived = await createAnnotationFromTemplate(
        input.sourceMatchId,
        currentUserId,
        input.ctId ?? null,
      );
      return NextResponse.json({ data: derived, ...derived }, { status: 201 });
    }

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
