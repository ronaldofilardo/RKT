import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

const ForgotSchema = z.object({
  identifier: z.string().min(3).max(120),
  contact: z.string().max(80).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
    }
    const { identifier, contact } = parsed.data;
    const trimmed = identifier.trim();
    const isEmail = trimmed.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: trimmed.toLowerCase() } : { cpf: trimmed.replace(/\D/g, '') },
    });
    if (user) {
      const pending = await prisma.passwordResetRequest.findFirst({
        where: { userId: user.id, status: 'PENDING' },
      });
      if (!pending) {
        await prisma.passwordResetRequest.create({
          data: { userId: user.id, status: 'PENDING', contactHint: contact ?? null },
        });
      }
    }
    return NextResponse.json({ message: 'O suporte vai entrar em contato.' }, { status: 200 });
  } catch (error) {
    logger.error('[FORGOT POST]', error);
    return reportApiError(error);
  }
}
