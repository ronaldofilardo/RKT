/**
 * Validador e formatador de CNPJ (padrão numérico e alfanumérico RFB).
 */

export interface ValidationResult {
  isValid: boolean;
  code?: 'EMPTY' | 'INCOMPLETE' | 'TOO_LONG' | 'REPEATED' | 'INVALID_DV' | 'INVALID_FORMAT';
  message?: string;
}

function charWeight(char: string): number {
  return char.charCodeAt(0) - 48;
}

function calculateDv(chars: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += charWeight(chars[i]) * weights[i];
  }
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function validateCnpj(cnpj: string): ValidationResult {
  if (!cnpj || !cnpj.trim()) {
    return { isValid: false, code: 'EMPTY', message: 'CNPJ é obrigatório' };
  }
  const cleaned = cnpj.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (cleaned.length < 14) {
    return { isValid: false, code: 'INCOMPLETE', message: `CNPJ incompleto (faltam ${14 - cleaned.length} dígitos)` };
  }
  if (cleaned.length > 14) {
    return { isValid: false, code: 'TOO_LONG', message: 'CNPJ deve ter 14 caracteres' };
  }
  if (/^(\d)\1{13}$/.test(cleaned)) {
    return { isValid: false, code: 'REPEATED', message: 'CNPJ com dígitos repetidos' };
  }

  const base = cleaned.slice(0, 12);
  const dv1 = calculateDv(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = calculateDv(base + dv1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  if (cleaned.slice(12) !== `${dv1}${dv2}`) {
    return { isValid: false, code: 'INVALID_DV', message: 'Dígito verificador do CNPJ inválido' };
  }
  return { isValid: true };
}

export function isValidCnpj(cnpj: string): boolean {
  return validateCnpj(cnpj).isValid;
}

export function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/^([0-9A-Z]{2})([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{4})([0-9]{2})$/, '$1.$2.$3/$4-$5');
}
