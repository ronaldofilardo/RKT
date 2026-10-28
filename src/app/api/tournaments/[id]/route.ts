import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAccessHandler } from '@/lib/access-handler';

const UpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
}).refine((data) => Object.keys(data).length > 0);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withAccessHandler(
    request,
    'ct:tournament:manage',
    async () => (await prisma.tournament.findUnique({ where: { id }, select: { ctId: true } })) ?? undefined,
    async () => {
      const body = UpdateSchema.safeParse(await request.json());
      if (!body.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', details: body.error.flatten() }, { status: 400 });
      }
      try {
        const item = await prisma.$transaction(async (tx) => {
          const updated = await tx.tournament.update({ where: { id }, data: body.data });
          if (body.data.name) {
            await tx.match.updateMany({
              where: { tournamentId: id },
              data: { tournamentName: body.data.name },
            });
          }
          return updated;
        });
        return NextResponse.json(item);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return NextResponse.json({ error: 'TOURNAMENT_ALREADY_EXISTS' }, { status: 409 });
        }
        throw error;
      }
    },
  );
}
