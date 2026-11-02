export const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export type BrazilianUF = (typeof BRAZILIAN_UFS)[number];

export function isBrazilianUF(value: unknown): value is BrazilianUF {
  return typeof value === 'string' && BRAZILIAN_UFS.includes(value as BrazilianUF);
}
