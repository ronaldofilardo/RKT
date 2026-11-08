// ste-exception R-03: Endpoint DELETE (soft delete de treinador) adicionado ao existente PATCH; justificado por nova operação de exclusão no gestor.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { isValidCpf } from '@/lib/validators/cpf.validator';
import { getGestorCtId, denyGestor } from '../../_logic';
import { updateCoachPermissions } from '../../coaches-logic';

const CoachUpdateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  cpf: z.string().min(1, 'CPF é obrigatório').refine((v) => isValidCpf(v), 'CPF inválido'),
  birthDate: z.string().optional(),
  email: z.string().email('E-mail inválido'),
});

const CoachPermissionSchema = z.object({
  canInsertAthletes: z.boolean(),
});

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  const { id } = await context.params;

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const membership = await prisma.membership.findFirst({
        where: {
          OR: [{ id }, { userId: id }],
          kind: 'TREINADOR',
          ctId,
          status: 'ACTIVE',
        },
        include: { user: true },
      });

      if (!membership || !membership.user) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Treinador não encontrado no clube' },
          { status: 404 },
        );
      }

      // Soft delete: encerra a membresia
      await prisma.membership.update({
        where: { id: membership.id },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'TREINADOR_DELETADO',
          resourceType: 'Membership',
          resourceId: membership.id,
          ctId,
          meta: {
            coachId: membership.userId,
            coachName: membership.user.name,
          },
        },
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
      logger.error('[COACH DELETE]', error);
      return reportApiError(error);
    }
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  const { id } = await context.params;

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => null);
      if (!body || typeof body !== 'object') {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Payload inválido' }, { status: 400 });
      }

      // Se for alteração de permissão rápida
      if ('canInsertAthletes' in body && Object.keys(body).length === 1) {
        const parsed = CoachPermissionSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Payload inválido' }, { status: 400 });
        }
        await updateCoachPermissions(id, { canInsertAthletes: parsed.data.canInsertAthletes });
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Edição de cadastro do treinador
      const parsed = CoachUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      const membership = await prisma.membership.findFirst({
        where: {
          OR: [{ id }, { userId: id }],
          kind: 'TREINADOR',
          ctId,
          status: 'ACTIVE',
        },
        include: { user: true },
      });

      if (!membership || !membership.user) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Treinador não encontrado no clube' },
          { status: 404 },
        );
      }

      const normalizedCpf = parsed.data.cpf.replace(/\D/g, '');
      const normalizedEmail = parsed.data.email.toLowerCase();

      // Checar unicidade de CPF e email em outros usuários
      const conflictUser = await prisma.user.findFirst({
        where: {
          id: { not: membership.userId },
          OR: [
            { cpf: normalizedCpf },
            { email: normalizedEmail },
          ],
        },
      });

      if (conflictUser) {
        if (conflictUser.cpf === normalizedCpf) {
          return NextResponse.json(
            { error: 'CONFLICT', message: 'CPF já cadastrado para outro usuário' },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { error: 'CONFLICT', message: 'E-mail já cadastrado para outro usuário' },
          { status: 409 },
        );
      }

      await prisma.user.update({
        where: { id: membership.userId },
        data: {
          name: parsed.data.name,
          cpf: normalizedCpf,
          email: normalizedEmail,
        },
      });

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'TREINADOR_DADOS_ATUALIZADOS',
          resourceType: 'User',
          resourceId: membership.userId,
          ctId,
          meta: {
            name: parsed.data.name,
            cpf: normalizedCpf,
            email: normalizedEmail,
          },
        },
      });

      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
      logger.error('[COACH PATCH]', error);
      return reportApiError(error);
    }
  });
}
