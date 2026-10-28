import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { withAccessHandler } from '@/lib/access-handler';

const BodySchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(60),
});

function isPlatformStaff(actor: { memberships: readonly { kind: string; preset?: string | null; status: string }[] }): boolean {
  return actor.memberships.some(
    (m) => m.kind === 'PLATAFORMA' && m.status === 'ACTIVE' && (m.preset === 'ADMIN' || m.preset === 'SUPORTE'),
  );
}

function gestorCtIds(actor: { memberships: readonly { kind: string; ctId?: string | null; status: string }[] }): string[] {
  return actor.memberships
    .filter((m) => m.kind === 'GESTOR' && m.status === 'ACTIVE' && !!m.ctId)
    .map((m) => m.ctId as string);
}

export async function GET(request: NextRequest) {
  return withAccessHandler(request, 'report:view', null, async ({ actor }) => {
    try {
      const fullAccess = isPlatformStaff(actor);
      const myCtIds = gestorCtIds(actor);

      const items = await prisma.trainingCenter.findMany({
        orderBy: { name: 'asc' },
      });

      const payload = items.map((ct) => {
        const base = { id: ct.id, name: ct.name, slug: ct.slug };
        if (fullAccess || myCtIds.includes(ct.id)) {
          return {
            ...base,
            status: ct.status,
            createdByUserId: ct.createdByUserId,
            cnpj: ct.cnpj,
            legalName: ct.legalName,
            phone: ct.phone,
            email: ct.email,
            address: ct.address,
            legalRepName: ct.legalRepName,
            legalRepEmail: ct.legalRepEmail,
            legalRepPhone: ct.legalRepPhone,
          };
        }
        return base;
      });

      return NextResponse.json({ items: payload }, { status: 200 });
    } catch (error) {
      logger.error('[TRAINING CENTERS GET]', error);
      return reportApiError(error);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAccessHandler(request, 'platform:ct:manage', null, async ({ user }) => {
    try {
      const body = await request.json();
      const parsed = BodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 });
      }
      const ct = await prisma.trainingCenter.create({
        data: { name: parsed.data.name, slug: parsed.data.slug, status: 'ACTIVE', createdByUserId: user.id },
      });
      return NextResponse.json(ct, { status: 201 });
    } catch (error) {
      logger.error('[TRAINING CENTER POST]', error);
      return reportApiError(error);
    }
  });
}
