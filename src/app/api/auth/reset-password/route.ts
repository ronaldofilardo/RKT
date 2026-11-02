import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const ResetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const { token, password } = parsed.data;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const req = await prisma.passwordResetRequest.findFirst({
      where: { tokenHash, status: 'LINK_ISSUED', tokenExpiresAt: { gt: new Date() } },
    });
    if (!req) {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      }),
      prisma.passwordResetRequest.update({
        where: { id: req.id },
        data: { status: 'DONE', doneAt: new Date() },
      }),
    ]);
    const response = NextResponse.json({ message: 'Senha redefinida.' }, { status: 200 });
    const cookieOpts = { path: '/', maxAge: 0, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };
    response.cookies.set('rkt_access_token', '', { ...cookieOpts, httpOnly: true });
    response.cookies.set('access_token', '', cookieOpts);
    response.cookies.set('user_role', '', cookieOpts);
    return response;
  } catch (error) {
    logger.error('[RESET PASSWORD POST]', error);
    return reportApiError(error);
  }
}
