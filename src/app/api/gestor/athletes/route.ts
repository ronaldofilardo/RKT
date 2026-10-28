import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../_logic';
import { createAthleteByGestor } from '../athletes-logic';

const AthleteSchema = z.object({
  name: z.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  gender: z.enum(['MASCULINO', 'FEMININO', 'OUTRO']),
  laterality: z.enum(['DESTRO', 'CANHOTO', 'AMBIDEXTRO']),
});

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const playerCts = await prisma.playerCT.findMany({
        where: { ctId },
        include: {
          player: {
            select: {
              id: true,
              name: true,
              email: true,
              birthDate: true,
              gender: true,
              dominance: true,
              user: { select: { id: true, name: true, cpf: true, email: true, mustChangePassword: true } },
            },
          },
        },
        orderBy: { since: 'desc' },
      });
      return NextResponse.json({ items: playerCts }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR ATHLETES GET]', error);
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
      const parsed = AthleteSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }, { status: 400 });
      }

      const result = await createAthleteByGestor({
        ...parsed.data,
        ctId,
        issuedByUserId: user.id,
      });

      if (result.conflict) {
        return NextResponse.json({ error: 'CONFLICT', message: result.message, inviteKind: result.inviteKind }, { status: 409 });
      }

      return NextResponse.json({
        message: 'Atleta criado com sucesso.',
        userId: result.userId,
        playerId: result.playerId,
        tempPassword: result.tempPassword,
        linkExpiresAt: result.linkExpiresAt,
      }, { status: 201 });
    } catch (error) {
      logger.error('[GESTOR ATHLETES POST]', error);
      return reportApiError(error);
    }
  });
}
