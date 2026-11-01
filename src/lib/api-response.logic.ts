import { NextRequest, NextResponse } from 'next/server';
import { ZodType, ZodError } from 'zod';
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
 * Extrai a primeira mensagem relevante de um ZodError para o atributo `message`
 * da resposta de erro de validação, traduzindo o erro técnico em texto acionável.
 */
export function formatZodMessage(error: ZodError): string {
  const first = error.errors[0];
  if (!first) return 'Dados inválidos.';
  const campo = first.path.length > 0 ? String(first.path[0]) : '';
  return campo ? `${campo}: ${first.message}` : first.message;
}

/**
 * Valida request body com Zod e retorna erro padronizado
 *
 * @example
 * const body = await validatedRequest(request, CreateMatchSchema);
 */
export async function validatedRequest<T>(
  request: NextRequest,
  schema: ZodType<T, any, any>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiError(
        'VALIDATION_ERROR',
        error.flatten(),
        400,
        formatZodMessage(error)
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
    const fieldMap: Record<string, string> = {};
    if (error.details && typeof error.details === 'object' && 'fieldErrors' in (error.details as Record<string, unknown>)) {
      const fe = (error.details as Record<string, unknown>).fieldErrors as Record<string, string[]>;
      for (const [k, v] of Object.entries(fe)) {
        if (Array.isArray(v) && v.length > 0) fieldMap[k] = v[0];
      }
    }
    const payload = {
      error: error.code,
      message: error.message,
      details: error.details,
      fields: Object.keys(fieldMap).length > 0 ? fieldMap : undefined,
    };
    return NextResponse.json(
      { ...payload, data: payload },
      { status: error.status }
    );
  }

  // Erro inesperado — não expor detalhes
  const fallback = { error: 'INTERNAL_ERROR', message: 'Erro interno do servidor' };
  return NextResponse.json(
    { ...fallback, data: fallback },
    { status: 500 }
  );
}
