import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const UserDataSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(120),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  isActive: z.boolean().optional(),
  canOperate: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withAccessHandler(
    request,
    'platform:users:manage',
    null,
    async ({ user }) => {
      try {
        const body = await request.json();
        const parsed = UserDataSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const existingUser = await prisma.user.findUnique({
          where: { id },
        });
        if (!existingUser) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Usuário não encontrado' },
            { status: 404 },
          );
        }

        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            name: parsed.data.name,
            email: parsed.data.email.toLowerCase(),
            cpf: parsed.data.cpf.replace(/\D/g, ''),
            ...(parsed.data.isActive !== undefined
              ? { isActive: parsed.data.isActive }
              : {}),
            ...(parsed.data.canOperate !== undefined
              ? { canOperate: parsed.data.canOperate }
              : {}),
          },
          select: {
            id: true,
            name: true,
            email: true,
            cpf: true,
            role: true,
            isActive: true,
            canOperate: true,
            updatedAt: true,
          },
        });

        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            action: 'GESTOR_DADOS_ATUALIZADOS_SUPORTE',
            resourceType: 'User',
            resourceId: updatedUser.id,
            meta: {
              name: parsed.data.name,
              email: parsed.data.email,
              cpf: parsed.data.cpf,
            },
          },
        });

        return NextResponse.json(updatedUser, { status: 200 });
      } catch (error) {
        logger.error('[USER PATCH]', error);
        return reportApiError(error);
      }
    },
  );
}
