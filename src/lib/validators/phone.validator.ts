/**
 * Validador e formatador de telefone brasileiro (fixo e celular).
 */

export interface PhoneValidationResult {
  isValid: boolean;
  code?: 'EMPTY' | 'INCOMPLETE' | 'TOO_LONG' | 'INVALID_DDD' | 'INVALID_LANDLINE' | 'INVALID_MOBILE';
  message?: string;
}

const VALID_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
]);

export function validatePhone(phone: string): PhoneValidationResult {
  if (!phone || !phone.trim()) {
    return { isValid: false, code: 'EMPTY', message: 'Telefone é obrigatório' };
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) {
    return { isValid: false, code: 'INCOMPLETE', message: `Telefone incompleto (faltam ${10 - digits.length} dígitos)` };
  }
  if (digits.length > 11) {
    return { isValid: false, code: 'TOO_LONG', message: 'Telefone não pode ter mais de 11 dígitos' };
  }

  const ddd = digits.slice(0, 2);
  if (!VALID_DDDS.has(ddd)) {
    return { isValid: false, code: 'INVALID_DDD', message: `DDD (${ddd}) inválido` };
  }

  if (digits.length === 10) {
    const firstDigit = digits[2];
    if (!['2', '3', '4', '5'].includes(firstDigit)) {
      return { isValid: false, code: 'INVALID_LANDLINE', message: 'Telefone fixo deve iniciar com 2, 3, 4 ou 5' };
    }
  } else if (digits.length === 11) {
    if (digits[2] !== '9') {
      return { isValid: false, code: 'INVALID_MOBILE', message: 'Celular deve iniciar com o dígito 9' };
    }
  }

  return { isValid: true };
}

export function isValidPhone(phone: string): boolean {
  return validatePhone(phone).isValid;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

