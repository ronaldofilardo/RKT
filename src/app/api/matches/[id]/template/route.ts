import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { flexibleIdValidator } from '@/schemas/common';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { closePublicTemplate } from '@/services/match-template-close.logic';

const ParamsSchema = z.object({ id: flexibleIdValidator });

/** Encerra o cartaz público (soft-delete). Derivadas não são afetadas. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const parsedParams = ParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'ID de cartaz inválido', details: parsedParams.error.flatten() }, { status: 400 });
  }
  const { id } = parsedParams.data;

  return withAccessHandler(request, 'match:annotate', null, async ({ user }) => {
    try {
      const result = await closePublicTemplate(id, user.id);

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error, message: result.message },
          { status: result.status },
        );
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
      logger.error('[MATCH TEMPLATE DELETE]', error);
      return reportApiError(error);
    }
  });
}
