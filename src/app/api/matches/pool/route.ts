import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAccessHandler } from '@/lib/access-handler';
import { reportApiError } from '@/lib/api.logic';
import { logger } from '@/lib/logger';
import { listPublicPool } from './pool-list.logic';

const PoolQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  return withAccessHandler(request, null, null, async ({ actor }) => {
    try {
      if (!actor.isActive) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Conta inativa ou inexistente' },
          { status: 403 },
        );
      }

      const { searchParams } = request.nextUrl;
      const parsed = PoolQuerySchema.safeParse({
        cursor: searchParams.get('cursor') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
      });
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Parâmetros inválidos' },
          { status: 400 },
        );
      }

      const items = await listPublicPool(parsed.data);
      const nextCursor = items.length === parsed.data.limit ? items[items.length - 1].id : null;

      return NextResponse.json({ data: { matches: items, nextCursor } });
    } catch (error) {
      logger.error('[MATCHES POOL GET]', error);
      return reportApiError(error);
    }
  });
}
