import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PointFlowInputSchema, type PointFlowInput } from '@/schemas/contracts';
import { logger } from '@/lib/logger';

export type PointRequestParse =
  | { ok: false; response: NextResponse }
  | { ok: true; data: PointFlowInput };

export async function parsePointRequestBody(request: NextRequest): Promise<PointRequestParse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    logger.point.parseError(e);
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'INVALID_BODY', message: 'Request body must be valid JSON' },
        { status: 400 },
      ),
    };
  }

  if (!body || typeof body !== 'object') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'INVALID_BODY', message: 'Request body is required' },
        { status: 400 },
      ),
    };
  }

  logger.point.received(body);
  const parsed = PointFlowInputSchema.safeParse(body);

  if (!parsed.success) {
    logger.point.validationError({
      body,
      issues: parsed.error.issues,
      flattened: parsed.error.flatten(),
    });
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
