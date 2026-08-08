/**
 * Logger port for the scoring domain.
 *
 * The scoring domain (`src/core/scoring/**`) MUST NOT depend on infrastructure
 * packages (no `console.*`, no `@/lib/logger`). It talks to logging only through
 * the `ILogger` abstraction. The default export (`noopLogger`) is dependency-free,
 * so domain code stays pure and side-effect free.
 *
 * Infrastructure layers (`src/lib/logger.ts`) provide a concrete adapter that
 * satisfies this interface; wiring happens at composition root (route handlers,
 * hooks, services), never inside `core/`.
 */

export interface ILogger {
  error(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  debug(message: string, context?: unknown): void;
}

/**
 * Default no-op logger. Used when no adapter is wired.
 * Safe to keep as a module-level singleton: it is stateless and pure.
 */
export const noopLogger: ILogger = {
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};
