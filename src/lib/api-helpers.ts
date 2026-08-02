import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from './errors';
import { logger } from './logger';

/**
 * Resposta JSON padronizada para APIs
 * 
 * @example
 * return jsonResponse({ users: [...] }, { status: 200 });
 * return jsonResponse({ data: match }, { status: 201 });
 */
export function jsonResponse<T>(
  data: T,
  options?: { status?: number; headers?: Record<string, string> }
): NextResponse<{ data: T }> {
  const { status = 200, headers = {} } = options ?? {};
  return NextResponse.json({ data }, { status, headers });
}

/**
 * Valida request body com Zod e retorna erro padronizado
 * 
 * @example
 * const body = await validatedRequest(request, CreateMatchSchema);
 */
export async function validatedRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(
        'VALIDATION_ERROR',
        error.flatten(),
        400
      );
    }
    throw new ApiError('INVALID_JSON', 'Corpo da requisição inválido', 400);
  }
}

/**
 * Handler centralizado de erros de API
 * 
 * @example
 * try { ... } catch (error) { return handleApiError(error); }
 */
export function handleApiError(error: unknown): NextResponse {
  logger.error('[API_ERROR]', error);

  if (error instanceof ApiError) {
    return jsonResponse(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status }
    );
  }

  // Erro inesperado — não expor detalhes
  return jsonResponse(
    { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' },
    { status: 500 }
  );
}

/**
 * Paginação padrão com cursor
 * 
 * @example
 * const { items, nextCursor } = paginate(matches, cursor, limit);
 */
export function paginate<T extends { id: string }>(
  items: T[],
  _cursor: string | null,
  limit: number
): { items: T[]; nextCursor: string | null } {
  const nextCursor = items.length === limit ? items[items.length - 1].id : null;
  return { items, nextCursor };
}

/**
 * Extrair paginação de query params
 *
 * Limites:
 * - DEFAULT_LIMIT = 20
 * - MAX_LIMIT = 100 (DoS prevention — TD-043)
 *
 * @example
 * const { cursor, limit } = extractPagination(searchParams);
 */
export const PAGINATION_LIMITS = {
  DEFAULT: 20,
  MAX: 100,
} as const;

export function extractPagination(searchParams: URLSearchParams) {
  const cursor = searchParams.get('cursor') ?? undefined;
  const rawLimit = parseInt(searchParams.get('limit') || String(PAGINATION_LIMITS.DEFAULT), 10);
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : PAGINATION_LIMITS.DEFAULT;
  const limit = Math.min(safeLimit, PAGINATION_LIMITS.MAX);
  return { cursor, limit };
}

/**
 * Extrair paginação numérica (page-based)
 *
 * @example
 * const { page, limit, offset } = extractPagePagination(searchParams);
 */
export function extractPagePagination(searchParams: URLSearchParams) {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || String(PAGINATION_LIMITS.DEFAULT), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : PAGINATION_LIMITS.DEFAULT;
  const limit = Math.min(PAGINATION_LIMITS.MAX, Math.max(1, safeLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}