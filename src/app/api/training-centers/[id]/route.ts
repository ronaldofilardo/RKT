import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { bumpSessionVersion } from '@/services/accessService';

const StatusSchema = z.object({ status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']) });
const ClubDataSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60),
  razaoSocial: z.string().min(2).max(120),
  telefone: z.string().min(8),
  email: z.string().email(),
  address: z.object({ rua: z.string().min(1), numero: z.string().min(1), complemento: z.string().optional(), bairro: z.string().min(1), cidade: z.string().min(1), estado: z.string().length(2), cep: z.string().min(1) }).optional(),
  legalRepName: z.string().min(2).max(120),
  legalRepEmail: z.string().email(),
  legalRepPhone: z.string().min(8),
});
type ClubData = z.infer<typeof ClubDataSchema>;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAccessHandler(request, 'platform:memberships:manage', null, async ({ user }) => {
    try {
      const body = await request.json();
      const statusParsed = StatusSchema.safeParse(body);
      if (statusParsed.success) {
        const currentCt = await prisma.trainingCenter.findUnique({ where: { id }, select: { id: true, status: true } });
        if (!currentCt) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        const newStatus = statusParsed.data.status;
        const ct = await prisma.trainingCenter.update({ where: { id }, data: { status: newStatus } });

        const action = newStatus === 'ACTIVE'
          ? (currentCt.status === 'SUSPENDED' ? 'CLUBE_REATIVADO' : 'CLUBE_APROVADO')
          : 'CLUBE_SUSPENSO';

        if (newStatus === 'SUSPENDED' && prisma.membership?.findMany) {
          const gestores = await prisma.membership.findMany({ where: { ctId: id, status: 'ACTIVE' }, select: { userId: true } });
          if (gestores.length > 0) {
            await Promise.all(gestores.map((g) => bumpSessionVersion(g.userId)));
          }
        }

        await prisma.auditLog.create({
          data: { actorUserId: user.id, action, resourceType: 'TrainingCenter', resourceId: ct.id, ctId: ct.id, meta: { status: newStatus } },
        });
        return NextResponse.json(ct, { status: 200 });
      }

      const dataParsed = ClubDataSchema.safeParse(body);
      if (!dataParsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: dataParsed.error.flatten() }, { status: 400 });
      const data: ClubData = dataParsed.data;
      const ct = await prisma.trainingCenter.update({
        where: { id },
        data: { name: data.name, slug: data.slug, legalName: data.razaoSocial, phone: data.telefone, email: data.email, address: data.address, legalRepName: data.legalRepName, legalRepEmail: data.legalRepEmail, legalRepPhone: data.legalRepPhone },
      });
      await prisma.auditLog.create({ data: { actorUserId: user.id, action: 'CLUBE_DADOS_ATUALIZADOS', resourceType: 'TrainingCenter', resourceId: ct.id, ctId: ct.id, meta: { name: data.name, slug: data.slug, razaoSocial: data.razaoSocial } } });
      return NextResponse.json(ct, { status: 200 });
    } catch (error) {
      logger.error('[TRAINING CENTER PATCH]', error);
      return reportApiError(error);
    }
  });
}
