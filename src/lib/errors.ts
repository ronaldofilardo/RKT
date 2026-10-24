/**
 * Erro de API padronizado — fachada de re-exports.
 */
export {
  ApiError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
} from './errors.api-error';

export {
  ConflictError,
  MethodNotAllowedError,
  RateLimitError,
  getPrismaErrorCode,
} from './errors.domain';
