/**
 * Feature flags centrais da aplicação.
 */
export function isAreaUrlsEnabled(): boolean {
  // Ativo por padrão se não definido explicitamente como 'false'
  return process.env.AREA_URLS !== 'false';
}

