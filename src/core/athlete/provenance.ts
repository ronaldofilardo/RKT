/**
 * Procedência esportiva do atleta (A0.12 Fase 7): clube e UF de origem.
 *
 * Usado para broadcast da procedência em cards do dashboard/relatórios,
 * placar e listagem de atletas — ex.: "Pinheiros - SP".
 */
export function formatProvenance(
  club?: string | null,
  state?: string | null,
): string | null {
  const c = club?.trim() || null;
  const s = state?.trim() || null;
  if (c && s) return `${c} - ${s}`;
  return c ?? s;
}
