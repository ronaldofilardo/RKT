import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { IndicateStaffRequestSchema } from '@/schemas/guardian';
import { indicateStaff } from '@/services/guardian-staff-indicate.logic';

function ipHashOf(request: NextRequest): string {
  return Buffer.from(request.headers.get('x-forwarded-for') || 'local').toString('base64');
}

/**
 * POST /api/guardians/me/indicate-staff — o responsável indica clube/treinador
 * do menor: vínculo nasce `PENDING` (sem acesso prematuro aos dados) ou convite
 * assinado para treinador externo (WhatsApp). Escopo `RESP` garante monotutela.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = IndicateStaffRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { playerId, indication } = parsed.data;

  return withAccessHandler(request, 'guardian:link', () => ({ playerId }), async ({ user }) => {
    try {
      const result = await prisma.$transaction((tx) =>
        indicateStaff(tx, { guardianUserId: user.id, playerId, indication }),
      );
      await prisma.auditLog
        .create({
          data: {
            actorUserId: user.id,
            action: 'GUARDIAN_STAFF_INDICATED',
            resourceType: 'Player',
            resourceId: playerId,
            meta: { kind: indication.kind, targetId: indication.targetId ?? null },
            ipHash: ipHashOf(request),
          },
        })
        .catch(() => null);
      return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
      logger.error('[GUARDIAN INDICATE STAFF POST]', error);
      return reportApiError(error);
    }
  });
}
