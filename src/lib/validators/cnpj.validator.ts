/**
 * Validador de CNPJ (Cadastro Nacional da Pessoa Jurídica).
 * Valida máscara, comprimento e os dois dígitos verificadores (DV).
 * Rejeita sequências com todos os dígitos iguais.
 */

function strip(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function calculateDv(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function isValidCnpj(cnpj: string): boolean {
  const cleaned = strip(cnpj);
  if (cleaned.length !== 14) return false;

  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const base = cleaned.slice(0, 12);
  const dv1 = calculateDv(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calculateDv(base + dv1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cleaned === base + dv1 + dv2;
}

export function formatCnpj(cnpj: string): string {
  const cleaned = strip(cnpj);
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}
