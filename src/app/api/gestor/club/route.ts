import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../_logic';
import { ClubPatchSchema, mapClubPatchData } from './club-patch.logic';

export async function GET(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async () => {
    try {
      const ct = await prisma.trainingCenter.findUnique({
        where: { id: ctId },
        select: {
          id: true, name: true, slug: true, cnpj: true, legalName: true,
          phone: true, email: true, address: true, legalRepName: true,
          legalRepCpf: true, legalRepEmail: true, legalRepPhone: true, status: true,
        },
      });
      if (!ct) return NextResponse.json({ error: 'NOT_FOUND', message: 'CT não encontrado' }, { status: 404 });
      return NextResponse.json({ data: ct }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR CLUB GET]', error);
      return reportApiError(error);
    }
  });
}

export async function PATCH(request: NextRequest) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(request, 'platform:memberships:manage', () => ({ ctId }), async ({ user }) => {
    try {
      const body = await request.json().catch(() => null);
      if (!body) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Corpo inválido' }, { status: 400 });
      }
      if ('cnpj' in body && body.cnpj !== undefined && body.cnpj !== null) {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'O CNPJ não pode ser alterado' }, { status: 403 });
      }

      const parsed = ClubPatchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() }, { status: 400 });
      }

      const data = mapClubPatchData(parsed.data);
      if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Nenhum campo para atualizar' }, { status: 400 });
      }

      const ct = await prisma.trainingCenter.update({ where: { id: ctId }, data });
      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'CLUBE_DADOS_ATUALIZADOS_GESTOR',
          resourceType: 'TrainingCenter',
          resourceId: ct.id,
          ctId: ct.id,
          meta: data,
        },
      });

      return NextResponse.json({ data: ct }, { status: 200 });
    } catch (error) {
      logger.error('[GESTOR CLUB PATCH]', error);
      return reportApiError(error);
    }
  });
}
