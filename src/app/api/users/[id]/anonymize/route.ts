import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { name: 'Atleta removido', isActive: false },
    });
    return NextResponse.json({ id: user.id, message: 'Anonimizado.' }, { status: 200 });
  } catch (error) {
    logger.error('[USER ANONYMIZE POST]', error);
    return reportApiError(error);
  }
}
