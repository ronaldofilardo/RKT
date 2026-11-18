import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { decodeCursor, searchEntities } from './entities-search.logic';

const QuerySchema = z.object({
  q: z.string().trim().min(2, 'Digite ao menos 2 letras').max(80),
  type: z.enum(['ALL', 'CT', 'COACH']).default('ALL'),
  limit: z.coerce.number().int().min(1).max(10).default(10),
  cursor: z.string().max(512).optional(),
});

/**
 * GET /api/entities/search — busca CTs ativos e treinadores particulares do
 * pool para o responsável indicar a equipe técnica do menor (A0.21, Fase 2).
 * Autenticado (§13.4): sem enumeração pública de nomes.
 */
export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async () => {
    try {
      const sp = request.nextUrl.searchParams;
      const parsed = QuerySchema.safeParse({
        q: sp.get('q') ?? undefined,
        type: sp.get('type') ?? undefined,
        limit: sp.get('limit') ?? undefined,
        cursor: sp.get('cursor') ?? undefined,
      });
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error) },
          { status: 400 },
        );
      }
      const { q, type, limit, cursor } = parsed.data;
      const page = await searchEntities({ q, type, limit, cursor: decodeCursor(cursor) });
      return NextResponse.json(
        { data: page },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      );
    } catch (error) {
      logger.error('[ENTITIES SEARCH GET]', error);
      return reportApiError(error);
    }
  });
}
