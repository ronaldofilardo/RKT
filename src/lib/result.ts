/**
 * Result<T, E> type para error handling explícito sem exceptions.
 *
 * Útil em fire-and-forget flows (keepalive, silent sync) onde não queremos
 * que um throw escape e quebre a UI. Ao invés disso, o caller checa
 * `.success` antes de proceder.
 *
 * @example
 * const result: Result<void, AbandonError> = await markSessionAbandoned(...);
 * if (!result.success) {
 *   logger.session.abandonFailed(result.error);
 * }
 */

export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(r: Result<T, E>): r is { success: true; value: T } {
  return r.success;
}

export function isErr<T, E>(r: Result<T, E>): r is { success: false; error: E } {
  return !r.success;
}

export async function tryAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
