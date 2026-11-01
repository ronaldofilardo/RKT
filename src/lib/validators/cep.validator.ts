/**
 * Validador e formatador de CEP brasileiro.
 */

export interface CepValidationResult {
  isValid: boolean;
  code?: 'EMPTY' | 'INCOMPLETE' | 'TOO_LONG';
  message?: string;
}

export function validateCep(cep: string): CepValidationResult {
  if (!cep || !cep.trim()) {
    return { isValid: false, code: 'EMPTY', message: 'CEP é obrigatório' };
  }
  const digits = cep.replace(/\D/g, '');
  if (digits.length < 8) {
    return { isValid: false, code: 'INCOMPLETE', message: `CEP incompleto (faltam ${8 - digits.length} dígitos)` };
  }
  if (digits.length > 8) {
    return { isValid: false, code: 'TOO_LONG', message: 'CEP deve ter exatamente 8 dígitos' };
  }
  return { isValid: true };
}

export function isValidCep(cep: string): boolean {
  return validateCep(cep).isValid;
}

export function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return cep;
  return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

