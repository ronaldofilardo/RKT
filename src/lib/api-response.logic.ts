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
 * try { ... } catch (error) { return reportApiError(error); }
 */
export function reportApiError(error: unknown): NextResponse {
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
