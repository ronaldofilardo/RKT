import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.passwordResetRequest.update({
      where: { id },
      data: { status: 'LINK_ISSUED', tokenHash, tokenExpiresAt: expiresAt },
    });
    return NextResponse.json({ token, expiresAt }, { status: 200 });
  } catch (error) {
    logger.error('[SUPPORT ISSUE RESET POST]', error);
    return reportApiError(error);
  }
}
