import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const ParamsSchema = z.object({ id: flexibleIdValidator });
const BodySchema = z.object({ canOperate: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de usuário inválido', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;
  return withAccessHandler(request, 'platform:users:manage', null, async () => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }
      const user = await prisma.user.update({
        where: { id },
        data: { canOperate: parsed.data.canOperate },
      });
      return NextResponse.json({ id: user.id, canOperate: user.canOperate }, { status: 200 });
    } catch (error) {
      logger.error('[USER OPERATE PATCH]', error);
      return reportApiError(error);
    }
  });
}

