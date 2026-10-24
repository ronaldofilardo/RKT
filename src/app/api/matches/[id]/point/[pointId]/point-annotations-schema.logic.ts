import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { RallyDetailsSchema } from '@/schemas/contracts';

export const AnnotationUpdateSchema = z.object({
  annotations: z.object({
    rallyDetails: RallyDetailsSchema.partial().optional(),
    rallyLength: z.number().int().optional(),
    isFirstServe: z.boolean().optional(),
    isSecondServe: z.boolean().optional(),
    firstFaultDetail: z
      .object({
        errorType: z.string().optional(),
        serveEffect: z.string().optional(),
        direction: z.string().optional(),
      })
      .nullable()
      .optional(),
    note: z.string().max(500).optional(),
    zone: z.string().optional(),
    stroke: z.string().optional(),
    hitterId: z.string().optional(),
    receiverId: z.string().optional(),
  }),
});

export async function validateAnnotatorIds(
  id: string,
  updates: { hitterId?: string; receiverId?: string },
): Promise<NextResponse | null> {
  if (!updates.hitterId && !updates.receiverId) return null;

  const match = await prisma.match.findUnique({
    where: { id },
    select: { player1Id: true, player2Id: true, player1PartnerId: true, player2PartnerId: true },
  });
  if (!match) return null;

  const validIds = new Set([
    match.player1Id,
    match.player2Id,
    match.player1PartnerId,
    match.player2PartnerId,
  ].filter(Boolean));

  if (updates.hitterId && !validIds.has(updates.hitterId)) {
    return NextResponse.json(
      { error: 'INVALID_HITTER', message: 'Atleta não pertence a esta partida' },
      { status: 400 }
    );
  }
  if (updates.receiverId && !validIds.has(updates.receiverId)) {
    return NextResponse.json(
      { error: 'INVALID_RECEIVER', message: 'Atleta não pertence a esta partida' },
      { status: 400 }
    );
  }
  return null;
}
