/**
 * Erro de API padronizado
 * 
 * @example
 * throw new ApiError('VALIDATION_ERROR', { field: 'email' }, 400);
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    public details?: unknown,
    public status: number = 400
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

/**
 * Erro de validação
 * 
 * @example
 * throw new ValidationError({ email: ['inválido'] });
 */
export class ValidationError extends ApiError {
  constructor(details: unknown) {
    super('VALIDATION_ERROR', details, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Erro de não encontrado
 * 
 * @example
 * throw new NotFoundError('Match', matchId);
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', { resource, id }, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de autorização
 * 
 * @example
 * throw new ForbiddenError('ADMIN', userRole);
 */
export class ForbiddenError extends ApiError {
  constructor(requiredRole: string, currentRole?: string) {
    super('FORBIDDEN', { requiredRole, currentRole }, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Erro de não autorizado (autenticação)
 * 
 * @example
 * throw new UnauthorizedError('Token expirado');
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Não autorizado') {
    super('UNAUTHORIZED', { message }, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Erro de conflito (duplicate)
 * 
 * @example
 * throw new ConflictError('Partida já existe', { existing: duplicate });
 */
export class ConflictError extends ApiError {
  constructor(message: string, existing?: unknown) {
    super('CONFLICT', { message, existing }, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Erro de método não permitido
 * 
 * @example
 * throw new MethodNotAllowedError('GET');
 */
export class MethodNotAllowedError extends ApiError {
  constructor(method: string) {
    super('METHOD_NOT_ALLOWED', { method }, 405);
    this.name = 'MethodNotAllowedError';
  }
}

/**
 * Erro de rate limit
 * 
 * @example
 * throw new RateLimitError('login', 10, '1h');
 */
export class RateLimitError extends ApiError {
  constructor(endpoint: string, limit: number, window: string) {
    super('RATE_LIMIT_EXCEEDED', { endpoint, limit, window }, 429);
    this.name = 'RateLimitError';
  }
}