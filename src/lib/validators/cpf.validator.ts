/**
 * Validador de CPF (Cadastro de Pessoas Físicas).
 * Valida máscara, comprimento e os dois dígitos verificadores (DV) de forma rigorosa.
 * Rejeita sequências com todos os dígitos iguais.
 */

function strip(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function calculateDv(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function isValidCpf(cpf: string): boolean {
  const cleaned = strip(cpf);
  if (cleaned.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  const base = cleaned.slice(0, 9);
  const dv1 = calculateDv(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calculateDv(base + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cleaned === base + dv1 + dv2;
}

export function formatCpf(cpf: string): string {
  const cleaned = strip(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
