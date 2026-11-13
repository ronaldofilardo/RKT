import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { isMinor } from '@/core/access/age';
import { reportApiError } from '@/lib/api.logic';

const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
});

export async function PATCH(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      if (!actor?.userId) {
        return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
      }

      if (actor.athletePlayerId) {
        const player = await prisma.player.findUnique({
          where: { id: actor.athletePlayerId },
          select: { birthDate: true },
        });
        if (player?.birthDate && isMinor(player.birthDate, new Date())) {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: 'Atletas menores de 18 anos não podem alterar dados cadastrais diretamente' },
            { status: 403 },
          );
        }
      }

      const body = await request.json();
      const parsed = UpdateProfileSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const newName = parsed.data.name;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: actor.userId },
          data: { name: newName },
        });

        if (actor.athletePlayerId) {
          await tx.player.update({
            where: { id: actor.athletePlayerId },
            data: { name: newName },
          });
        }
      });

      return NextResponse.json({ success: true, name: newName });
    } catch (error) {
      return reportApiError(error);
    }
  });
}

