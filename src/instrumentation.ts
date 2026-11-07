/**
 * Boot do servidor Next: valida o destino do banco antes de atender qualquer requisição.
 * Premissa P-01 (docs/RULES.md) — processo local nunca sobe apontando para o Neon.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { assertDbTarget, describeDbTarget } = await import('./lib/db/db-target');
  const target = assertDbTarget();

  console.log(`[db] alvo=${describeDbTarget(target)}`);
}
