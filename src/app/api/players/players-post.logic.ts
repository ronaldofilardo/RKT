import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { CreatePlayerInputSchema } from '@/schemas/player';
import { createPlayer } from '@/services/playerService';
import { getActor } from '@/services/accessService';
import { actorCtIds } from '@/core/access/pool';
import { isMinor } from '@/core/access/age';
import type { Actor } from '@/core/access';

type CreatingProfile = 'ATLETA' | 'GESTOR' | 'TREINADOR';

function actorCreatingProfile(actor: Actor): CreatingProfile | null {
  const isGestor = actor.memberships.some((m) => m.kind === 'GESTOR' && m.status === 'ACTIVE' && !!m.ctId);
  if (isGestor) return 'GESTOR';
  const isTreinador = actor.memberships.some((m) => m.kind === 'TREINADOR' && m.status === 'ACTIVE');
  if (isTreinador) return 'TREINADOR';
  const isPlatformAdmin = actor.memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN');
  if (isPlatformAdmin) return 'GESTOR';
  if (actor.athletePlayerId) return 'ATLETA';
  return null;
}

export async function handlePlayersPost(
  body: unknown,
  userId: string,
): Promise<NextResponse> {
  try {
    const parsed = CreatePlayerInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: {
            error: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Dados inválidos',
            details: parsed.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const { myClub, ctId, cpf, ...playerData } = parsed.data;

    const actor = await getActor(userId);
    if (!actor || !actor.isActive) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Conta inativa ou inexistente' },
        { status: 403 },
      );
    }

    const creatingProfile = actorCreatingProfile(actor);
    if (creatingProfile === 'TREINADOR' && isMinor(playerData.birthDate, new Date())) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Treinadores não podem cadastrar atletas menores de 18 anos. O cadastro deve ser feito pelo jovem ou pelo gestor.' },
        { status: 403 },
      );
    }
    const cts = actorCtIds(actor);
    const isAvulsoCoach = creatingProfile === 'TREINADOR' && cts.length === 0;
    const shouldLink = Boolean(myClub);

    let resolvedCtId: string | null = null;
    if (shouldLink) {
      if (myClub && cts.length === 0 && !isAvulsoCoach) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Ator sem CT vinculado para modo "Meu clube"' },
          { status: 403 },
        );
      }
      if (cts.length > 1 && !ctId) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'CT obrigatorio quando o ator tem mais de um CT vinculado' },
          { status: 400 },
        );
      }
      resolvedCtId = ctId ?? cts[0] ?? null;
    }

    const player = await createPlayer({
      ...playerData,
      cpf: cpf ?? null,
      myClub: shouldLink && (!!resolvedCtId || isAvulsoCoach),
      ctId: resolvedCtId,
      createdByUserId: playerData.createdByUserId ?? userId,
      actorProfile: creatingProfile,
    });

    return NextResponse.json({ data: player }, { status: 201 });
  } catch (error) {
    logger.error('[PLAYERS POST]', error);
    return reportApiError(error);
  }
}
