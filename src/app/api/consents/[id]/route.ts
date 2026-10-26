import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const record = await prisma.consentRecord.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    logger.error('[CONSENT PATCH]', error);
    return reportApiError(error);
  }
}
