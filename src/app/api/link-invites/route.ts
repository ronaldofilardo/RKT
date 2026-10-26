import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const BodySchema = z.object({
  ctId: z.string().min(1),
  kind: z.enum(['TREINADOR', 'ATLETA', 'GESTOR']),
  createdByUserId: z.string().min(1),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

export async function GET(_request: NextRequest) {
  try {
    const items = await prisma.linkInvite.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    logger.error('[LINK INVITES GET]', error);
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
    const token = randomBytes(32).toString('hex');
    const code = randomBytes(4).toString('hex').toUpperCase();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const codeHash = createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + parsed.data.expiresInDays * 24 * 60 * 60 * 1000);
    const invite = await prisma.linkInvite.create({
      data: {
        ctId: parsed.data.ctId,
        kind: parsed.data.kind,
        tokenHash,
        codeHash,
        createdByUserId: parsed.data.createdByUserId,
        expiresAt,
        maxUses: 1,
      },
    });
    return NextResponse.json({ id: invite.id, token, code, expiresAt }, { status: 201 });
  } catch (error) {
    logger.error('[LINK INVITE POST]', error);
    return reportApiError(error);
  }
}
