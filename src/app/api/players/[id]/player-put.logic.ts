import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import { getRLSUser } from '@/lib/auth';
import { UpdatePlayerInputSchema } from '@/schemas/player';
import { getPlayerById, updatePlayer } from '@/services/playerService';
import { buildIdentityUpdate } from './player-put-identity.logic';
import {
  checkPlayerEditPermission,
  validatePlayerRankings,
  buildPlayerUpdatePayload,
  resolveEffectiveProfile,
} from './player-put-validation.logic';

function handlePutError(error: unknown) {
  logger.error('[PLAYERS PUT]', error);
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status },
    );
  }
  return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
}

export async function putPlayerResponse(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const parsedBody = UpdatePlayerInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      const message = parsedBody.error.issues[0]?.message || 'Dados inválidos';
      return NextResponse.json({ error: 'VALIDATION_ERROR', message }, { status: 400 });
    }

    const existing = await getPlayerById(id);
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
    }

    const permission = checkPlayerEditPermission(existing as any, getRLSUser(), id);
    if (!permission.allowed) {
      return NextResponse.json({ error: 'FORBIDDEN', message: permission.message }, { status: 403 });
    }

    const { rankings, name, cpf } = parsedBody.data;
    const { parsedBirthDate, calculatedAge, effectiveAge, effectiveGender } =
      resolveEffectiveProfile(parsedBody.data, existing);

    if (rankings) {
      const rankingError = validatePlayerRankings(rankings, effectiveAge, effectiveGender);
      if (rankingError) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: rankingError }, { status: 400 });
      }
    }

    const identityData = await buildIdentityUpdate({
      userId: existing.userId,
      name: name !== undefined ? name.trim() : undefined,
      cpf,
    });

    const updateData = buildPlayerUpdatePayload(parsedBody.data, calculatedAge, parsedBirthDate, identityData);
    const updated = await updatePlayer(id, updateData as Parameters<typeof updatePlayer>[1]);
    return NextResponse.json(updated);
  } catch (error) {
    return handlePutError(error);
  }
}
