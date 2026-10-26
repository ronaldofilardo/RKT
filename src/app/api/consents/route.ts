import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  guardianUserId: z.string().min(1),
  playerId: z.string().min(1),
  termsVersion: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const record = await prisma.consentRecord.create({
      data: {
        guardianUserId: parsed.data.guardianUserId,
        playerId: parsed.data.playerId,
        purpose: 'DATA',
        termsVersion: parsed.data.termsVersion,
        grantedAt: new Date(),
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    logger.error('[CONSENT POST]', error);
    return reportApiError(error);
  }
}
