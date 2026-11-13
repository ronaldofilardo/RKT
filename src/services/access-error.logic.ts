/**
 * Detecção e tipagem de erros transitórios de infraestrutura de banco de dados.
 * Evita que timeouts ou quedas do PostgreSQL sejam interpretados como usuário inexistente (falso 401).
 */

export class DatabaseConnectionError extends Error {
  public readonly isDatabaseError = true;
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

const DB_CONNECTION_PATTERNS = [
  'cant reach database server',
  "can't reach database server",
  'connection terminated',
  'connection refused',
  'connection timeout',
  'query timed out',
  'operation timed out',
  'timed out fetching a new connection',
  'server closed the connection',
  'prismaclientinitializationerror',
  'prismaclientrustpanicerror',
];

export function isDatabaseConnectionError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DatabaseConnectionError) return true;

  const err = error as { name?: string; message?: string; code?: string };
  const str = `${err.name || ''} ${err.message || ''} ${err.code || ''}`.toLowerCase();

  return DB_CONNECTION_PATTERNS.some((pattern) => str.includes(pattern));
}

