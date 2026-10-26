import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  action: z.string().min(1),
  resourceType: z.string().min(1),
  resourceId: z.string().optional(),
  actorUserId: z.string().optional(),
  ctId: z.string().optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const items = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[AUDIT GET]', error);
    return reportApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const log = await prisma.auditLog.create({ data: parsed.data });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    logger.error('[AUDIT POST]', error);
    return reportApiError(error);
  }
}
