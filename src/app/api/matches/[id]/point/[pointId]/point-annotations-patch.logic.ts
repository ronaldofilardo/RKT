import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { emitMatchEvent } from '@/lib/match-events';
import { AnnotationUpdateSchema, validateAnnotatorIds } from './point-annotations-schema.logic';

export async function patchPointAnnotations(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pointId: string }> }
) {
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

    const invalidAnnotator = await validateAnnotatorIds(id, updates);
    if (invalidAnnotator) return invalidAnnotator;

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
}
