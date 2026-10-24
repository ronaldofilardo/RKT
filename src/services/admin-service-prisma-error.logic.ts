/**
 * Extrai `code` e `meta.target` do erro do Prisma sem depender de `any`.
 * Espelha `err?.code` / `err?.meta?.target` sobre valores arbitrários.
 */
export function readPrismaError(error: unknown): { code?: string; target?: unknown } {
  if (typeof error !== 'object' || error === null) return {};
  const candidate = error as { code?: unknown; meta?: unknown };
  const meta =
    typeof candidate.meta === 'object' && candidate.meta !== null
      ? (candidate.meta as { target?: unknown })
      : undefined;
  return {
    code: typeof candidate.code === 'string' ? candidate.code : undefined,
    target: meta?.target,
  };
}
