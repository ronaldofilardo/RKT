import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { withRLSHandler } from '@/lib/auth';
import { getPlayerById } from '@/services/playerService';
import { putPlayerResponse } from './player-put.logic';
import { deletePlayerResponse } from './player-delete.logic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAccessHandler(request, 'athlete:search', null, async () => {
    try {
      const { id } = await params;
      const player = await getPlayerById(id);
      if (!player) {
        return NextResponse.json({ error: 'NOT_FOUND', message: 'Atleta não encontrado' }, { status: 404 });
      }
      return NextResponse.json(player, { status: 200 });
    } catch (error) {
      logger.error('[PLAYERS GET BY ID]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    return putPlayerResponse(request, context);
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    return deletePlayerResponse(context);
  });
}

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  identityStatus: z.enum(['CONFIRMED', 'PROVISIONAL']).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    const { id } = await params;
    try {
      const body = await request.json();
      const parsed = PatchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }
      const player = await prisma.player.update({ where: { id }, data: parsed.data });
      return NextResponse.json(player, { status: 200 });
    } catch (error) {
      logger.error('[PLAYER PATCH]', error);
      return reportApiError(error);
    }
  });
}

