/**
 * Validador e formatador de CPF.
 */

export interface CpfValidationResult {
  isValid: boolean;
  code?: 'EMPTY' | 'INCOMPLETE' | 'TOO_LONG' | 'REPEATED' | 'INVALID_DV';
  message?: string;
}

function calculateDv(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(digits[i]) * weights[i];
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function validateCpf(cpf: string): CpfValidationResult {
  if (!cpf || !cpf.trim()) {
    return { isValid: false, code: 'EMPTY', message: 'CPF é obrigatório' };
  }
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length < 11) {
    return { isValid: false, code: 'INCOMPLETE', message: `CPF incompleto (faltam ${11 - cleaned.length} dígitos)` };
  }
  if (cleaned.length > 11) {
    return { isValid: false, code: 'TOO_LONG', message: 'CPF deve ter 11 dígitos' };
  }
  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { isValid: false, code: 'REPEATED', message: 'CPF com dígitos repetidos' };
  }

  const base = cleaned.slice(0, 9);
  const dv1 = calculateDv(base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calculateDv(base + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);

  if (cleaned !== base + dv1 + dv2) {
    return { isValid: false, code: 'INVALID_DV', message: 'Dígito verificador do CPF inválido' };
  }
  return { isValid: true };
}

export function isValidCpf(cpf: string): boolean {
  return validateCpf(cpf).isValid;
}

export function formatCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
