import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { listAvailableTemplates } from '@/services/match-available.logic';

const AvailableQuerySchema = z.object({
  scope: z.enum(['all', 'private', 'public']).optional().default('private'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(30),
});

/**
 * Lista cartazes (públicos ou privados do círculo) que o usuário autenticado
 * pode descobrir e anotar de forma isolada.
 */
export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      const { searchParams } = request.nextUrl;
      const parsed = AvailableQuerySchema.safeParse({
        scope: searchParams.get('scope') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
      });
      if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos' }, { status: 400 });
      }
      const matches = await listAvailableTemplates(actor, parsed.data);
      return NextResponse.json({ data: { matches } });
    } catch (error) {
      logger.error('[MATCHES AVAILABLE GET]', error);
      return reportApiError(error);
    }
  });
}

