/**
 * Validador e catálogo das 27 Unidades Federativas (UF) do Brasil.
 */

export const BRAZIL_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export type BrazilUf = (typeof BRAZIL_UFS)[number];

export interface UfValidationResult {
  isValid: boolean;
  code?: 'EMPTY' | 'INVALID_UF';
  message?: string;
}

const UF_SET = new Set<string>(BRAZIL_UFS);

export function validateUf(uf: string): UfValidationResult {
  if (!uf || !uf.trim()) {
    return { isValid: false, code: 'EMPTY', message: 'UF é obrigatória' };
  }
  const normalized = uf.trim().toUpperCase();
  if (!UF_SET.has(normalized)) {
    return { isValid: false, code: 'INVALID_UF', message: `UF "${uf}" inválida` };
  }
  return { isValid: true };
}

export function isValidUf(uf: string): boolean {
  return validateUf(uf).isValid;
}

export function normalizeUf(uf: string): string {
  return uf ? uf.trim().toUpperCase() : '';
}

