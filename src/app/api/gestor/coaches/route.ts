import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtIds, getGestorCtId, denyGestor } from '../_logic';
import { listCoaches, createCoach } from '../coaches-logic';

const CoachSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('E-mail inválido'),
});

export async function GET(request: NextRequest) {
  const ctIds = await getGestorCtIds(request);
  if (ctIds.length === 0) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId: ctIds[0] }), async () => {
    try {
      const memberships = await listCoaches(ctIds);
      return NextResponse.json(
        { items: memberships },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (error) {
      logger.error('[GESTOR COACHES GET]', error);
      return reportApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => null);
      const parsed = CoachSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }, { status: 400 });
      }

      const result = await createCoach(ctId, user.id, parsed.data);
      if ('error' in result) {
        return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
      }

      return NextResponse.json({
        message: 'Treinador criado com sucesso.',
        userId: result.userId,
        tempPassword: result.tempPassword,
        linkExpiresAt: result.linkExpiresAt,
      }, { status: 201 });
    } catch (error) {
      logger.error('[GESTOR COACHES POST]', error);
      return reportApiError(error);
    }
  });
}
