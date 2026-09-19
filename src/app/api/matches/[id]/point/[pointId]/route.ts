import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withRLSHandler } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { emitMatchEvent } from '@/lib/match-events';
import { RallyDetailsSchema } from '@/schemas/contracts';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id, pointId } = await params;

      const pointLog = await prisma.pointLog.findFirst({
        where: { id: pointId, matchId: id, voidedAt: null },
        select: { id: true, matchId: true },
      });

      if (!pointLog) {
        return NextResponse.json({ error: 'POINT_NOT_FOUND' }, { status: 404 });
      }

      const updated = await prisma.pointLog.update({
        where: { id: pointId },
        data: { voidedAt: new Date(), sequenceNumber: null },
        select: { id: true, voidedAt: true },
      });

      emitMatchEvent(id, 'state_changed', { action: 'point_voided', pointId });

      return NextResponse.json({ success: true, voidedAt: updated.voidedAt });
    } catch (error) {
      logger.error('[VOID POINT]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}

const AnnotationUpdateSchema = z.object({
  annotations: z.object({
    rallyDetails: RallyDetailsSchema.partial().optional(),
    rallyLength: z.number().int().optional(),
    isFirstServe: z.boolean().optional(),
    isSecondServe: z.boolean().optional(),
    firstFaultDetail: z
      .object({
        errorType: z.string().optional(),
        serveEffect: z.string().optional(),
        direction: z.string().optional(),
      })
      .nullable()
      .optional(),
    note: z.string().max(500).optional(),
    zone: z.string().optional(),
    stroke: z.string().optional(),
  }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
  return withRLSHandler(request, 'ANNOTATOR', async () => {
    try {
      const { id, pointId } = await params;
      const body = await request.json();

      const pointLog = await prisma.pointLog.findFirst({
        where: { id: pointId, matchId: id, voidedAt: null },
        select: { id: true, matchId: true, annotations: true },
      });

      if (!pointLog) {
        return NextResponse.json({ error: 'POINT_NOT_FOUND' }, { status: 404 });
      }

      const parsed = AnnotationUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const existing = (pointLog.annotations as Record<string, unknown>) ?? {};
      const updates = parsed.data.annotations;

      let merged: Record<string, unknown> = { ...existing };

      if (updates.rallyDetails) {
        merged.rallyDetails = {
          ...(existing.rallyDetails as Record<string, unknown>),
          ...updates.rallyDetails,
        };
      }

      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'rallyDetails' && value !== undefined) {
          merged[key] = value;
        }
      }

      const updatedPoint = await prisma.pointLog.update({
        where: { id: pointId },
        data: { annotations: merged as Prisma.InputJsonValue },
        select: { id: true, annotations: true },
      });

      emitMatchEvent(id, 'state_changed', { action: 'point_annotations_updated', pointId });

      return NextResponse.json({ success: true, point: updatedPoint });
    } catch (error) {
      logger.error('[PATCH POINT ANNOTATIONS]', error);
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
  });
}
