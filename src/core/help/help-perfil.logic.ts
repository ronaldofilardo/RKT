/**
 * Mapeamento puro de áreas do sistema para o slug do conteúdo de ajuda.
 * ADMIN e SUPORTE ficam de fora (sem conteúdo próprio na Central de Ajuda).
 */
export const HELP_PERFIL_SLUGS: Readonly<Record<string, string>> = {
  ATLETA: 'atleta',
  ANOTADOR: 'anotador',
  ESPECTADOR: 'espectador',
  GESTOR: 'gestor',
  TREINADOR_CLUBE: 'treinador',
  TREINADOR_AVULSO: 'treinador',
  RESPONSAVEL: 'responsavel',
};

/** A área possui artigos na Central de Ajuda? */
export function hasHelpContent(area?: string | null): boolean {
  if (!area) return false;
  return area in HELP_PERFIL_SLUGS;
}

/** Slug do conteúdo para a área ativa; null quando não há conteúdo. */
export function perfilSlugForArea(area?: string | null): string | null {
  if (!area) return null;
  return HELP_PERFIL_SLUGS[area] ?? null;
}
