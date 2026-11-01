/**
 * Validador e higienizador de endereço de e-mail.
 */

export interface EmailValidationResult {
  isValid: boolean;
  code?: 'EMPTY' | 'CONTAINS_SPACE' | 'MISSING_AT' | 'MULTIPLE_AT' | 'INVALID_USER' | 'MISSING_DOMAIN' | 'DOMAIN_NO_DOT' | 'INVALID_DOMAIN';
  message?: string;
}

export function validateEmail(email: string): EmailValidationResult {
  if (!email || !email.trim()) {
    return { isValid: false, code: 'EMPTY', message: 'E-mail é obrigatório' };
  }
  const trimmed = email.trim();
  if (/\s/.test(trimmed)) {
    return { isValid: false, code: 'CONTAINS_SPACE', message: 'E-mail não pode conter espaços' };
  }
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) {
    return { isValid: false, code: 'MISSING_AT', message: 'E-mail deve conter "@"' };
  }
  if (atCount > 1) {
    return { isValid: false, code: 'MULTIPLE_AT', message: 'E-mail deve conter apenas um "@"' };
  }

  const [user, domain] = trimmed.split('@');
  if (!user || user.length === 0) {
    return { isValid: false, code: 'INVALID_USER', message: 'Informe a parte inicial do e-mail antes do "@"' };
  }
  if (!domain || domain.length === 0) {
    return { isValid: false, code: 'MISSING_DOMAIN', message: 'Informe o domínio após o "@"' };
  }
  if (!domain.includes('.')) {
    return { isValid: false, code: 'DOMAIN_NO_DOT', message: 'Domínio deve conter ao menos um ponto (ex: .com)' };
  }
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return { isValid: false, code: 'INVALID_DOMAIN', message: 'Domínio do e-mail contém formato inválido' };
  }
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { isValid: false, code: 'INVALID_DOMAIN', message: 'Extensão de domínio inválida (ex: .com ou .br)' };
  }

  // Validação geral de formato (RFC 5322 simplificado)
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  if (!regex.test(trimmed)) {
    return { isValid: false, code: 'INVALID_DOMAIN', message: 'E-mail contém caracteres inválidos' };
  }

  return { isValid: true };
}

export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}

export function normalizeEmail(email: string): string {
  return email ? email.trim().toLowerCase() : '';
}

