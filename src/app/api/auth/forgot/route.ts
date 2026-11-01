import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';

import { isValidEmail } from '@/lib/validators/email.validator';
import { isValidPhone } from '@/lib/validators/phone.validator';

const ForgotSchema = z.object({
  identifier: z.string().min(3, 'Identificador é obrigatório').max(120),
  contact: z.string().max(80).optional().refine((val) => {
    if (!val || !val.trim()) return true;
    return isValidPhone(val) || isValidEmail(val);
  }, 'Contato deve ser um telefone ou e-mail válido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ForgotSchema.safeParse(body);
    if (!parsed.success) {
      const firstErr = parsed.error.errors[0]?.message || 'Dados inválidos';
      const fields: Record<string, string> = {};
      for (const err of parsed.error.errors) {
        const p = err.path.join('.');
        if (p && !fields[p]) fields[p] = err.message;
      }
      return NextResponse.json({ error: 'VALIDATION_ERROR', message: firstErr, fields, details: parsed.error.flatten() }, { status: 400 });
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
